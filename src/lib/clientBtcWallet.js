import * as bitcoin from 'bitcoinjs-lib';
import BIP32Factory from 'bip32';
import * as bip39 from 'bip39';
import ecc from '@bitcoinerlab/secp256k1';

bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);

const NETWORK = bitcoin.networks.testnet; // switch to bitcoin.networks.bitcoin for mainnet later
const DERIVATION_PATH = "m/84'/1'/0'/0/0"; // BIP84 native SegWit, testnet coin type
const API_BASE = 'https://mempool.space/testnet/api';
const DUST_SATS = 546;

function deriveNode(mnemonicPhrase) {
  if (!bip39.validateMnemonic(mnemonicPhrase.trim())) {
    throw new Error('Invalid recovery phrase.');
  }
  const seed = bip39.mnemonicToSeedSync(mnemonicPhrase.trim());
  const root = bip32.fromSeed(seed, NETWORK);
  return root.derivePath(DERIVATION_PATH);
}

export function getBtcAddress(mnemonicPhrase) {
  const node = deriveNode(mnemonicPhrase);
  const { address } = bitcoin.payments.p2wpkh({ pubkey: node.publicKey, network: NETWORK });
  return address;
}

export async function fetchBtcBalanceSats(address) {
  const res = await fetch(`${API_BASE}/address/${address}`);
  if (!res.ok) throw new Error('Failed to fetch balance.');
  const data = await res.json();
  const confirmed = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
  const pending = data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;
  return confirmed + pending;
}

export function satsToBtc(sats) {
  return (sats / 1e8).toFixed(8);
}

export function btcToSats(btc) {
  return Math.round(Number(btc) * 1e8);
}

async function fetchUtxos(address) {
  const res = await fetch(`${API_BASE}/address/${address}/utxo`);
  if (!res.ok) throw new Error('Failed to fetch UTXOs.');
  return res.json();
}

async function fetchFeeRate() {
  const res = await fetch(`${API_BASE}/v1/fees/recommended`);
  if (!res.ok) return 2; // sane fallback sat/vByte if the fee API is unreachable
  const data = await res.json();
  return data.hourFee || data.economyFee || 2;
}

export async function sendBtc({ mnemonicPhrase, toAddress, amountSats }) {
  const node = deriveNode(mnemonicPhrase);
  const payment = bitcoin.payments.p2wpkh({ pubkey: node.publicKey, network: NETWORK });
  const fromAddress = payment.address;

  const utxos = await fetchUtxos(fromAddress);
  if (!utxos.length) throw new Error('No spendable funds found for this address.');

  const feeRate = await fetchFeeRate();

  // Simple accumulative UTXO selection: keep adding inputs until we can
  // cover the send amount plus an estimated fee for the tx built so far.
  const psbt = new bitcoin.Psbt({ network: NETWORK });
  let inputSum = 0;
  let usedCount = 0;

  for (const utxo of utxos) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: payment.output,
        value: utxo.value,
      },
    });
    inputSum += utxo.value;
    usedCount += 1;

    // Rough vsize estimate: ~68 vbytes per P2WPKH input, ~31 per output,
    // plus ~10.5 overhead. Two outputs assumed (recipient + change).
    const estimatedVSize = usedCount * 68 + 2 * 31 + 11;
    const estimatedFee = Math.ceil(estimatedVSize * feeRate);

    if (inputSum >= amountSats + estimatedFee) break;
  }

  const finalVSize = usedCount * 68 + 2 * 31 + 11;
  const fee = Math.ceil(finalVSize * feeRate);

  if (inputSum < amountSats + fee) {
    throw new Error('Insufficient balance to cover the amount plus network fee.');
  }

  psbt.addOutput({ address: toAddress, value: amountSats });

  const change = inputSum - amountSats - fee;
  if (change > DUST_SATS) {
    psbt.addOutput({ address: fromAddress, value: change });
  }
  // If change is dust, it's simply absorbed into the fee rather than
  // creating an uneconomical tiny output.

  for (let i = 0; i < usedCount; i++) {
    psbt.signInput(i, node);
  }
  psbt.finalizeAllInputs();

  const rawTxHex = psbt.extractTransaction().toHex();

  const broadcastRes = await fetch(`${API_BASE}/tx`, {
    method: 'POST',
    body: rawTxHex,
  });
  if (!broadcastRes.ok) {
    const errText = await broadcastRes.text();
    throw new Error(errText || 'Broadcast failed.');
  }
  const txid = await broadcastRes.text();
  return txid;
}
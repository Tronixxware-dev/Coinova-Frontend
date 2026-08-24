import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../lib/api';

const CHAINS = [
  {
    id: 'TRON',
    label: 'USDT (TRC-20 / Tron testnet)',
    explorerTx: (hash) => `https://shasta.tronscan.org/#/transaction/${hash}`,
  },
  {
    id: 'ETH',
    label: 'ETH (Sepolia testnet)',
    explorerTx: (hash) => `https://sepolia.etherscan.io/tx/${hash}`,
  },
  {
    id: 'BTC',
    label: 'BTC (testnet4)',
    explorerTx: (hash) => `https://mempool.space/testnet4/tx/${hash}`,
  },
];

export default function CryptoWalletPanel({ accessToken, onBalanceChange }) {
  const [chain, setChain] = useState('TRON');
  const [address, setAddress] = useState(null);
  const [addressBusy, setAddressBusy] = useState(false);
  const [addressError, setAddressError] = useState(null);

  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);
  const [withdrawResult, setWithdrawResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const activeChain = CHAINS.find((c) => c.id === chain);

  async function handleShowAddress() {
    setAddressError(null);
    setAddressBusy(true);
    try {
      const data = await api.getDepositAddress(accessToken, chain);
      setAddress(data.address);
    } catch (err) {
      setAddressError(err.message || 'Could not load your deposit address.');
    } finally {
      setAddressBusy(false);
    }
  }

  async function handleCopy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleWithdraw(e) {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawResult(null);
    setWithdrawBusy(true);
    try {
      const result = await api.withdrawOnchain(accessToken, chain, {
        toAddress: toAddress.trim(),
        amount: Number(amount),
      });
      setWithdrawResult(result);
      setToAddress('');
      setAmount('');
      onBalanceChange?.();
    } catch (err) {
      setWithdrawError(err.message || 'Withdrawal failed.');
    } finally {
      setWithdrawBusy(false);
    }
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 space-y-4 lg:col-span-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          Crypto Deposit &amp; Withdraw
        </h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
          Testnet — real blockchain, no real value
        </span>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500">Asset</label>
        <select
          value={chain}
          onChange={(e) => {
            setChain(e.target.value);
            setAddress(null);
          }}
          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
        >
          {CHAINS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Receive</h3>
          {!address && (
            <button
              onClick={handleShowAddress}
              disabled={addressBusy}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-sm font-semibold rounded-lg px-4 py-2 transition disabled:opacity-50"
            >
              {addressBusy ? 'Loading…' : 'Show my deposit address'}
            </button>
          )}
          {addressError && <p className="text-red-400 text-xs">{addressError}</p>}
          {address && (
            <div className="space-y-3">
              <div className="bg-white p-3 rounded-lg inline-block">
                <QRCodeSVG value={address} size={140} />
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs break-all bg-slate-900/60 rounded px-2 py-1 flex-1">{address}</code>
                <button
                  onClick={handleCopy}
                  className="text-xs bg-slate-700 hover:bg-slate-600 rounded px-2 py-1 transition shrink-0"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Only send {activeChain.label} to this address. Deposits are usually credited within a minute.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Send</h3>
          <form onSubmit={handleWithdraw} className="space-y-2">
            <input
              type="text"
              placeholder="Destination address"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="number"
              step="any"
              min="0"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={withdrawBusy}
              className="w-full bg-slate-700 hover:bg-slate-600 text-sm font-semibold rounded-lg py-2 transition disabled:opacity-50"
            >
              {withdrawBusy ? 'Sending…' : 'Send'}
            </button>
          </form>
          {withdrawError && <p className="text-red-400 text-xs">{withdrawError}</p>}
          {withdrawResult && (
            <p className="text-emerald-400 text-xs break-all">
              Sent, view it on the explorer:{' '}
              <a
                href={activeChain.explorerTx(withdrawResult.txHash)}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {withdrawResult.txHash.slice(0, 10)}...
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
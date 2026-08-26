import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useWallet } from '../context/WalletContext';
import { getBtcAddress, fetchBtcBalanceSats, satsToBtc, btcToSats, sendBtc } from '../lib/clientBtcWallet';

export default function SelfCustodyBtcPanel() {
  const { wallet, isUnlocked } = useWallet();
  const mnemonicPhrase = wallet?.mnemonic?.phrase;

  const [address, setAddress] = useState(null);
  const [balanceSats, setBalanceSats] = useState(null);
  const [balanceError, setBalanceError] = useState('');
  const [loadingBalance, setLoadingBalance] = useState(false);

  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [txid, setTxid] = useState('');

  useEffect(() => {
    if (!mnemonicPhrase) return;
    try {
      setAddress(getBtcAddress(mnemonicPhrase));
    } catch (err) {
      console.error('Failed to derive BTC address:', err);
    }
  }, [mnemonicPhrase]);

  const refreshBalance = useCallback(async () => {
    if (!address) return;
    setLoadingBalance(true);
    setBalanceError('');
    try {
      const sats = await fetchBtcBalanceSats(address);
      setBalanceSats(sats);
    } catch (err) {
      console.error('Failed to fetch BTC balance:', err);
      setBalanceError('Could not load balance.');
    } finally {
      setLoadingBalance(false);
    }
  }, [address]);

  useEffect(() => {
    refreshBalance();
    const interval = setInterval(refreshBalance, 20000);
    return () => clearInterval(interval);
  }, [refreshBalance]);

  async function handleSend(e) {
    e.preventDefault();
    setSendError('');
    setTxid('');

    if (!mnemonicPhrase) {
      setSendError('Wallet is locked.');
      return;
    }
    if (!toAddress) {
      setSendError('Enter a recipient address.');
      return;
    }
    const amountSats = btcToSats(amount);
    if (!amountSats || amountSats <= 0) {
      setSendError('Enter an amount greater than 0.');
      return;
    }

    setSending(true);
    try {
      const resultTxid = await sendBtc({ mnemonicPhrase, toAddress, amountSats });
      setTxid(resultTxid);
      setToAddress('');
      setAmount('');
      refreshBalance();
    } catch (err) {
      console.error('BTC send failed:', err);
      setSendError(err.message || 'Transaction failed.');
    } finally {
      setSending(false);
    }
  }

  if (!isUnlocked || !address) {
    return (
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Bitcoin Wallet</h2>
        <p className="text-slate-400 text-sm">Unlock your wallet to view your balance.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Bitcoin Wallet (Testnet)</h2>
        {loadingBalance && balanceSats === null ? (
          <p className="text-slate-400 text-sm">Loading balance...</p>
        ) : balanceError ? (
          <p className="text-red-400 text-sm">{balanceError}</p>
        ) : (
          <p className="text-2xl font-bold text-emerald-400">{satsToBtc(balanceSats)} BTC</p>
        )}
      </div>

      <div>
        <p className="text-sm text-slate-400 mb-2">Receive</p>
        <div className="bg-white p-3 rounded-lg inline-block">
          <QRCodeSVG value={address} size={140} />
        </div>
        <p className="text-xs text-slate-300 mt-2 break-all font-mono">{address}</p>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(address)}
          className="mt-2 text-emerald-400 text-sm hover:underline"
        >
          Copy address
        </button>
      </div>

      <form onSubmit={handleSend} className="space-y-3">
        <p className="text-sm text-slate-400">Send</p>
        <input
          type="text"
          placeholder="Recipient address (tb1...)"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
        />
        <input
          type="text"
          placeholder="Amount (BTC)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
        />
        {sendError && <p className="text-red-400 text-sm">{sendError}</p>}
        {txid && (
          <p className="text-emerald-400 text-sm break-all">
            Sent!{' '}
            <a
              href={`https://blockstream.info/testnet/tx/${txid}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              View on Blockstream
            </a>
          </p>
        )}
        <button
          type="submit"
          disabled={sending}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium"
        >
          {sending ? 'Sending...' : 'Send BTC'}
        </button>
      </form>
    </div>
  );
}
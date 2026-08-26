import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { QRCodeSVG } from 'qrcode.react';
import { useWallet } from '../context/WalletContext';
import { provider } from '../lib/ethProvider';

export default function SelfCustodyWalletPanel() {
  const { wallet, address, isUnlocked } = useWallet();

  const [balance, setBalance] = useState(null);
  const [balanceError, setBalanceError] = useState('');
  const [loadingBalance, setLoadingBalance] = useState(false);

  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [txHash, setTxHash] = useState('');

  const refreshBalance = useCallback(async () => {
    if (!address) return;
    setLoadingBalance(true);
    setBalanceError('');
    try {
      const raw = await provider.getBalance(address);
      setBalance(ethers.formatEther(raw));
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setBalanceError('Could not load balance. Check your RPC connection.');
    } finally {
      setLoadingBalance(false);
    }
  }, [address]);

  useEffect(() => {
    refreshBalance();
    const interval = setInterval(refreshBalance, 15000);
    return () => clearInterval(interval);
  }, [refreshBalance]);

  async function handleSend(e) {
    e.preventDefault();
    setSendError('');
    setTxHash('');

    if (!isUnlocked || !wallet) {
      setSendError('Wallet is locked.');
      return;
    }
    if (!ethers.isAddress(toAddress)) {
      setSendError('Enter a valid Ethereum address.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setSendError('Enter an amount greater than 0.');
      return;
    }

    setSending(true);
    try {
      const connectedWallet = wallet.connect(provider);
      const tx = await connectedWallet.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount),
      });
      await tx.wait();
      setTxHash(tx.hash);
      setToAddress('');
      setAmount('');
      refreshBalance();
    } catch (err) {
      console.error('Send failed:', err);
      setSendError(err.shortMessage || err.message || 'Transaction failed.');
    } finally {
      setSending(false);
    }
  }

  if (!isUnlocked || !address) {
    return (
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Ethereum Wallet</h2>
        <p className="text-slate-400 text-sm">Unlock your wallet to view your balance.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Ethereum Wallet (Sepolia Testnet)</h2>
        {loadingBalance && balance === null ? (
          <p className="text-slate-400 text-sm">Loading balance...</p>
        ) : balanceError ? (
          <p className="text-red-400 text-sm">{balanceError}</p>
        ) : (
          <p className="text-2xl font-bold text-emerald-400">{balance} ETH</p>
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
          placeholder="Recipient address (0x...)"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
        />
        <input
          type="text"
          placeholder="Amount (ETH)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
        />
        {sendError && <p className="text-red-400 text-sm">{sendError}</p>}
        {txHash && (
          <p className="text-emerald-400 text-sm break-all">
            Sent!{' '}
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              View on Etherscan
            </a>
          </p>
        )}
        <button
          type="submit"
          disabled={sending}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium"
        >
          {sending ? 'Sending...' : 'Send ETH'}
        </button>
      </form>
    </div>
  );
}
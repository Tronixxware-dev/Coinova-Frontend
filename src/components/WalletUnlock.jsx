import { useState } from 'react';
import { importFromMnemonic } from '../lib/clientWallet';
import { useWallet } from '../context/WalletContext';

export default function WalletUnlock({ password, onUnlocked }) {
  const { setUnlockedWallet } = useWallet();
  const [mnemonicInput, setMnemonicInput] = useState('');
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);

  async function handleImport(e) {
    e.preventDefault();
    setImportError('');
    setImporting(true);
    try {
      const imported = await importFromMnemonic(mnemonicInput, password);
      setUnlockedWallet(imported);
      onUnlocked();
    } catch (err) {
      setImportError('That recovery phrase looks invalid. Please check it and try again.');
    } finally {
      setImporting(false);
    }
  }

  const cardClass = 'w-full max-w-sm bg-slate-800 rounded-xl p-8 space-y-5 shadow-xl';
  const inputClass =
    'w-full rounded-lg bg-slate-700 text-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500';
  const buttonClass =
    'w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-semibold rounded-lg py-2 transition';

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <form onSubmit={handleImport} className={cardClass}>
        <h1 className="text-2xl font-bold text-white text-center">Restore Your Wallet</h1>
        <p className="text-sm text-slate-400">
          We couldn't automatically unlock a wallet on this device. This happens on a new
          device, or if your account password has changed since your wallet was set up.
          Enter your 12-word recovery phrase to restore it — it'll be secured with your
          current login password automatically.
        </p>
        <textarea
          value={mnemonicInput}
          onChange={(e) => setMnemonicInput(e.target.value)}
          placeholder="Enter your 12-word recovery phrase"
          rows={3}
          className={inputClass}
        />
        {importError && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm rounded-lg px-3 py-2">
            {importError}
          </div>
        )}
        <button type="submit" disabled={importing} className={buttonClass}>
          {importing ? 'Restoring…' : 'Restore Wallet'}
        </button>
      </form>
    </div>
  );
}
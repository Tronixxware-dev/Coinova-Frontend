import { useState } from 'react';
import { hasStoredWallet, importFromMnemonic } from '../lib/clientWallet';
import { useWallet } from '../context/WalletContext';

export default function WalletUnlock({ onUnlocked }) {
  const { unlock, unlocking, unlockError, setUnlockedWallet } = useWallet();
  const [mode, setMode] = useState(hasStoredWallet() ? 'unlock' : 'import');
  const [password, setPassword] = useState('');
  const [mnemonicInput, setMnemonicInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);

  async function handleUnlock(e) {
    e.preventDefault();
    const ok = await unlock(password);
    if (ok) onUnlocked();
  }

  async function handleImport(e) {
    e.preventDefault();
    setImportError('');
    if (newPassword.length < 8) {
      setImportError('Wallet password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setImportError('Passwords do not match.');
      return;
    }
    setImporting(true);
    try {
      const imported = await importFromMnemonic(mnemonicInput, newPassword);
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
  const linkButtonClass = 'w-full text-sm text-slate-400 hover:text-emerald-400 underline';

  if (mode === 'unlock') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <form onSubmit={handleUnlock} className={cardClass}>
          <h1 className="text-2xl font-bold text-white text-center">Unlock Your Wallet</h1>
          <p className="text-sm text-slate-400">Enter your wallet password to unlock it on this device.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Wallet password"
            className={inputClass}
          />
          {unlockError && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm rounded-lg px-3 py-2">
              {unlockError}
            </div>
          )}
          <button type="submit" disabled={unlocking} className={buttonClass}>
            {unlocking ? 'Unlocking…' : 'Unlock'}
          </button>
          <button type="button" onClick={() => setMode('import')} className={linkButtonClass}>
            This isn't my device — import my wallet instead
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <form onSubmit={handleImport} className={cardClass}>
        <h1 className="text-2xl font-bold text-white text-center">Import Your Wallet</h1>
        <p className="text-sm text-slate-400">
          No wallet was found on this device. Enter your 12-word recovery phrase to restore it here,
          then set a password to encrypt it on this device.
        </p>
        <textarea
          value={mnemonicInput}
          onChange={(e) => setMnemonicInput(e.target.value)}
          placeholder="Enter your 12-word recovery phrase"
          rows={3}
          className={inputClass}
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New wallet password (min 8 characters)"
          className={inputClass}
        />
        <input
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          placeholder="Confirm password"
          className={inputClass}
        />
        {importError && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm rounded-lg px-3 py-2">
            {importError}
          </div>
        )}
        <button type="submit" disabled={importing} className={buttonClass}>
          {importing ? 'Importing…' : 'Import Wallet'}
        </button>
        <button type="button" onClick={() => setMode('unlock')} className={linkButtonClass}>
          Back to unlock
        </button>
      </form>
    </div>
  );
}
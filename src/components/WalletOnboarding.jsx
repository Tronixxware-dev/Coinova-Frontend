import { useState } from 'react';
import { generateWallet, encryptWallet, saveEncryptedWallet } from '../lib/clientWallet';
import { useWallet } from '../context/WalletContext';

const STEPS = {
  INTRO: 'intro',
  REVEAL: 'reveal',
  CONFIRM: 'confirm',
  PASSWORD: 'password',
};

export default function WalletOnboarding({ onWalletReady }) {
  const [step, setStep] = useState(STEPS.INTRO);
  const [wallet, setWallet] = useState(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { setUnlockedWallet } = useWallet();

  function handleGenerate() {
    const newWallet = generateWallet();
    setWallet(newWallet);
    setStep(STEPS.REVEAL);
  }

  function handleConfirmPhrase() {
    if (confirmInput.trim().toLowerCase() !== wallet.mnemonic.phrase.trim().toLowerCase()) {
      setError("That doesn't match your recovery phrase. Please re-check and try again.");
      return;
    }
    setError('');
    setStep(STEPS.PASSWORD);
  }

  async function handleSetPassword() {
    if (password.length < 8) {
      setError('Wallet password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const encryptedJson = await encryptWallet(wallet, password);
      saveEncryptedWallet(encryptedJson);
      setUnlockedWallet(wallet);
      onWalletReady(wallet);
    } catch (err) {
      setError('Something went wrong encrypting your wallet. Please try again.');
      setBusy(false);
    }
  }

  const cardClass = 'w-full max-w-sm bg-slate-800 rounded-xl p-8 space-y-5 shadow-xl';
  const inputClass =
    'w-full rounded-lg bg-slate-700 text-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500';
  const buttonClass =
    'w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-semibold rounded-lg py-2 transition';

  if (step === STEPS.INTRO) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className={cardClass}>
          <h1 className="text-2xl font-bold text-white text-center">Create Your Wallet</h1>
          <p className="text-sm text-slate-400">
            This wallet is created entirely on your device. Coinova never sees or stores
            your private key or recovery phrase — which also means we can never recover
            it for you if it's lost. You're fully responsible for keeping it safe.
          </p>
          <button onClick={handleGenerate} className={buttonClass}>
            Create Wallet
          </button>
        </div>
      </div>
    );
  }

  if (step === STEPS.REVEAL) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className={cardClass}>
          <h1 className="text-2xl font-bold text-white text-center">Your Recovery Phrase</h1>
          <p className="text-sm text-slate-400">
            Write these 12 words down in order and store them somewhere safe and offline.
            Anyone with this phrase can access your funds. Coinova cannot show it to you again.
          </p>
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-emerald-400 font-mono text-sm leading-relaxed break-words">
            {wallet.mnemonic.phrase}
          </div>
          <button onClick={() => setStep(STEPS.CONFIRM)} className={buttonClass}>
            I've Written It Down
          </button>
        </div>
      </div>
    );
  }

  if (step === STEPS.CONFIRM) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className={cardClass}>
          <h1 className="text-2xl font-bold text-white text-center">Confirm Your Phrase</h1>
          <p className="text-sm text-slate-400">
            Type your 12-word phrase back in to confirm you saved it correctly.
          </p>
          <textarea
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder="Enter your 12-word phrase"
            rows={3}
            className={inputClass}
          />
          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <button onClick={handleConfirmPhrase} className={buttonClass}>
            Confirm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className={cardClass}>
        <h1 className="text-2xl font-bold text-white text-center">Set a Wallet Password</h1>
        <p className="text-sm text-slate-400">
          This password encrypts your wallet on this device only. It's separate from your
          Coinova login password — choose something different.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Wallet password (min 8 characters)"
          className={inputClass}
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
          className={inputClass}
        />
        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <button onClick={handleSetPassword} disabled={busy} className={buttonClass}>
          {busy ? 'Encrypting…' : 'Encrypt & Finish'}
        </button>
      </div>
    </div>
  );
}
import { createContext, useContext, useState } from 'react';
import { hasStoredWallet, unlockWallet } from '../lib/clientWallet';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null); // live ethers.Wallet, memory-only
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  async function unlock(password) {
    setUnlocking(true);
    setUnlockError('');
    try {
      const unlocked = await unlockWallet(password);
      setWallet(unlocked);
      return true;
    } catch (err) {
      setUnlockError('Wrong wallet password, or no wallet found on this device.');
      return false;
    } finally {
      setUnlocking(false);
    }
  }

  // Used right after a wallet is freshly created/encrypted during
  // onboarding — we already have the live wallet in memory, so there's
  // no need to immediately re-decrypt it from storage.
  function setUnlockedWallet(freshWallet) {
    setWallet(freshWallet);
  }

  function lock() {
    setWallet(null);
  }

  const value = {
    wallet,
    address: wallet?.address ?? null,
    isUnlocked: wallet !== null,
    hasWalletOnDevice: hasStoredWallet(),
    unlock,
    setUnlockedWallet,
    lock,
    unlocking,
    unlockError,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;
}
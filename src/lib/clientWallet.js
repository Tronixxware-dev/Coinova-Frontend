import { ethers } from 'ethers';

const STORAGE_KEY = 'coinova_eth_wallet_v1';

// Generates a brand-new random wallet (mnemonic + keys) entirely in
// the browser using the device's cryptographically secure RNG.
// Nothing produced here is ever sent to the server.
export function generateWallet() {
  return ethers.Wallet.createRandom();
}

// Encrypts a wallet into the standard Web3 Secret Storage (keystore)
// JSON format using a password the user chooses. This is the format
// MetaMask and most wallets use for local encrypted storage.
export async function encryptWallet(wallet, password) {
  return wallet.encrypt(password);
}

// Persists the encrypted keystore JSON to this browser only.
export function saveEncryptedWallet(encryptedJson) {
  localStorage.setItem(STORAGE_KEY, encryptedJson);
}

export function hasStoredWallet() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

function getStoredEncryptedWallet() {
  return localStorage.getItem(STORAGE_KEY);
}

// Decrypts the stored keystore with the user's wallet password,
// returning a live ethers.Wallet held only in memory for this
// session — never written back to storage in plaintext form.
export async function unlockWallet(password) {
  const encryptedJson = getStoredEncryptedWallet();
  if (!encryptedJson) {
    throw new Error('No wallet found on this device. Import your recovery phrase instead.');
  }
  return ethers.Wallet.fromEncryptedJson(encryptedJson, password);
}

// Recreates a wallet from a saved 12-word recovery phrase (used when
// a user is on a new device, or cleared browser storage) and encrypts
// it fresh with a (possibly new) password for this device going forward.
export async function importFromMnemonic(mnemonicPhrase, password) {
  const wallet = ethers.Wallet.fromPhrase(mnemonicPhrase.trim());
  const encryptedJson = await encryptWallet(wallet, password);
  saveEncryptedWallet(encryptedJson);
  return wallet;
}

export function clearStoredWallet() {
  localStorage.removeItem(STORAGE_KEY);
}
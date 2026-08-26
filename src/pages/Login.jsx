import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import WalletUnlock from '../components/WalletUnlock';

export default function Login() {
  const { login, loading, error } = useAuth();
  const { unlock, hasWalletOnDevice } = useWallet();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [needsWalletRecovery, setNeedsWalletRecovery] = useState(false);
  const [walletSyncing, setWalletSyncing] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login({ email, password });
      setWalletSyncing(true);
      if (hasWalletOnDevice) {
        const ok = await unlock(password);
        if (ok) {
          navigate('/', { replace: true });
          return;
        }
      }
      // Either no wallet exists on this device yet, or it couldn't be
      // unlocked with the current login password (e.g. the account
      // password changed since the wallet was set up) — fall back to
      // recovery-phrase import, which re-links it automatically.
      setWalletSyncing(false);
      setNeedsWalletRecovery(true);
    } catch {
      // error is already surfaced via context
    }
  }

  function handleRecovered() {
    navigate('/', { replace: true });
  }

  if (needsWalletRecovery) {
    return <WalletUnlock password={password} onUnlocked={handleRecovered} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-slate-800 rounded-xl p-8 space-y-5 shadow-xl">
        <h1 className="text-2xl font-bold text-white text-center">Log in to Coinova</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-300 mb-1">Email</label>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm text-slate-300">Password</label>
            <Link to="/forgot-password" className="text-xs text-emerald-400 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 pr-16 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-slate-300 hover:text-emerald-400"
              tabIndex={-1}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || walletSyncing}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-semibold rounded-lg py-2 transition"
        >
          {loading ? 'Logging in…' : walletSyncing ? 'Unlocking wallet…' : 'Log in'}
        </button>
        <p className="text-sm text-slate-400 text-center">
          Don't have an account?{' '}
          <Link to="/signup" className="text-emerald-400 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
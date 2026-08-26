import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WalletUnlock from '../components/WalletUnlock';

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showWalletUnlock, setShowWalletUnlock] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login({ email, password });
      setShowWalletUnlock(true);
    } catch {
      // error is already surfaced via context
    }
  }

  function handleUnlocked() {
    navigate('/', { replace: true });
  }

  if (showWalletUnlock) {
    return <WalletUnlock onUnlocked={handleUnlocked} />;
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-semibold rounded-lg py-2 transition"
        >
          {loading ? 'Logging in…' : 'Log in'}
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
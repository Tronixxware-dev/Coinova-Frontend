import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-slate-800 rounded-xl p-6 space-y-4">
        <h1 className="text-xl font-bold text-center">Forgot Password</h1>

        {sent ? (
          <div className="space-y-2 text-sm text-center">
            <p className="text-emerald-400">If that email is registered, a reset link has been sent.</p>
            <p className="text-slate-500 text-xs">
              This is a dev environment with no real email provider wired up — check the backend
              terminal console for the reset link.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 text-sm font-semibold rounded-lg py-2 transition"
            >
              {busy ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-400">
          <Link to="/login" className="text-emerald-400 underline">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
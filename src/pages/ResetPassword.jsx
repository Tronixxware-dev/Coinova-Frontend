import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.resetPassword({ token, newPassword });
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-slate-800 rounded-xl p-6 space-y-4">
        <h1 className="text-xl font-bold text-center">Reset Password</h1>

        {!token && (
          <p className="text-red-400 text-sm text-center">
            This link is missing its reset token. Request a new one from the{' '}
            <Link to="/forgot-password" className="text-emerald-400 underline">
              forgot password
            </Link>{' '}
            page.
          </p>
        )}

        {token && done && (
          <p className="text-emerald-400 text-sm text-center">Password reset. Redirecting you to log in…</p>
        )}

        {token && !done && (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <input
              type="password"
              required
              minLength={8}
              placeholder="New password (min 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 text-sm font-semibold rounded-lg py-2 transition"
            >
              {busy ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
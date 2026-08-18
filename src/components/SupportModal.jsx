import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function SupportModal({ open, onClose }) {
  const { accessToken } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.submitSupportTicket(accessToken, { subject, message });
      setSent(true);
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleClose() {
    setSent(false);
    setError(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={handleClose} />
      <div className="relative bg-slate-800 rounded-xl p-5 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Contact Support</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white text-xl leading-none">
            &times;
          </button>
        </div>

        {sent ? (
          <div className="space-y-4">
            <p className="text-emerald-400 text-sm">
              Thanks — your message has been sent. We'll get back to you by email.
            </p>
            <button
              onClick={handleClose}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-sm font-semibold rounded-lg py-2 transition"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <input
              type="text"
              required
              maxLength={200}
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <textarea
              required
              maxLength={5000}
              rows={5}
              placeholder="Describe your question or issue…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 text-sm font-semibold rounded-lg py-2 transition"
            >
              {busy ? 'Sending…' : 'Send'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
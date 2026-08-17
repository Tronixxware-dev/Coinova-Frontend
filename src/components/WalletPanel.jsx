import { useState } from 'react';

const ASSETS = ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'XRP'];

export default function WalletPanel({ wallets, onDeposit, onWithdraw, busy }) {
  const [asset, setAsset] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('deposit');
  const [formError, setFormError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    try {
      if (mode === 'deposit') {
        await onDeposit({ asset, amount });
      } else {
        await onWithdraw({ asset, amount });
      }
      setAmount('');
    } catch (err) {
      setFormError(err.message);
    }
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 space-y-4">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Wallet</h2>

      <div className="space-y-1">
        {wallets.length === 0 && <p className="text-slate-500 text-sm">No balances yet.</p>}
        {wallets.map((w) => (
          <div key={w.asset} className="flex items-center justify-between text-sm py-1 border-b border-slate-700/50 last:border-0">
            <span className="text-slate-300 font-medium">{w.asset}</span>
            <div className="text-right">
              <div className="text-white font-mono">{Number(w.balance).toLocaleString(undefined, { maximumFractionDigits: 8 })}</div>
              {Number(w.locked_balance) > 0 && (
                <div className="text-xs text-amber-400 font-mono">
                  {Number(w.locked_balance).toLocaleString(undefined, { maximumFractionDigits: 8 })} locked
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-slate-700/50">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('deposit')}
            className={`flex-1 text-xs font-semibold rounded-lg py-1.5 transition ${
              mode === 'deposit' ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-300'
            }`}
          >
            Deposit
          </button>
          <button
            type="button"
            onClick={() => setMode('withdraw')}
            className={`flex-1 text-xs font-semibold rounded-lg py-1.5 transition ${
              mode === 'withdraw' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300'
            }`}
          >
            Withdraw
          </button>
        </div>

        {formError && <p className="text-red-400 text-xs">{formError}</p>}

        <div className="flex gap-2">
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            className="bg-slate-700 text-white text-sm rounded-lg px-2 py-1.5 outline-none"
          >
            {ASSETS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <input
            type="number"
            step="any"
            min="0"
            required
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-slate-700 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-1.5 transition"
        >
          {busy ? 'Processing…' : mode === 'deposit' ? 'Add funds' : 'Withdraw funds'}
        </button>
      </form>
    </div>
  );
}
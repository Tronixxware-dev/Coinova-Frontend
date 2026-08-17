import { useState } from 'react';

function formatDate(d) {
  return new Date(d).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function tierIndexForAmount(plans, amount) {
  if (!plans?.length) return -1;
  const tiers = plans[0].tiers;
  let idx = -1;
  for (let i = 0; i < tiers.length; i++) {
    if (amount >= tiers[i].min) idx = i;
  }
  return idx;
}

export default function StakingPanel({ summary, onStake, onWithdraw, stakeBusy, withdrawBusy }) {
  const plans = summary?.plans ?? [];
  const [amount, setAmount] = useState('');
  const [durationDays, setDurationDays] = useState(plans[0]?.durationDays ?? 7);
  const [stakeError, setStakeError] = useState(null);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [withdrawError, setWithdrawError] = useState(null);

  const numericAmount = Number(amount) || 0;
  const tierIndex = tierIndexForAmount(plans, numericAmount);
  const selectedPlan = plans.find((p) => p.durationDays === Number(durationDays));
  const previewTier = tierIndex >= 0 ? selectedPlan?.tiers[tierIndex] : null;

  async function handleStake(e) {
    e.preventDefault();
    setStakeError(null);
    try {
      await onStake({ amount, durationDays: Number(durationDays) });
      setAmount('');
    } catch (err) {
      setStakeError(err.message);
    }
  }

  async function handleWithdraw(stakeId) {
    setWithdrawError(null);
    setWithdrawingId(stakeId);
    try {
      await onWithdraw({ stakeId });
    } catch (err) {
      setWithdrawError(err.message);
    } finally {
      setWithdrawingId(null);
    }
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Staking</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
          Up to 4.00%/day
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/40 rounded-lg p-3">
          <div className="text-xs text-slate-500">Total Staked</div>
          <div className="text-lg font-mono text-white">
            {summary ? Number(summary.totalPrincipal).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
          </div>
        </div>
        <div className="bg-slate-900/40 rounded-lg p-3">
          <div className="text-xs text-slate-500">Unclaimed Interest</div>
          <div className="text-lg font-mono text-emerald-400">
            {summary ? Number(summary.totalAccruedInterest).toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'}
          </div>
        </div>
      </div>

      <form onSubmit={handleStake} className="space-y-2 pt-2 border-t border-slate-700/50">
        <label className="block text-xs text-slate-400">Stake USDT</label>
        {stakeError && <p className="text-red-400 text-xs">{stakeError}</p>}

        <div className="flex gap-2">
          <select
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            className="bg-slate-700 text-white text-sm rounded-lg px-2 py-1.5 outline-none"
          >
            {plans.map((p) => (
              <option key={p.durationDays} value={p.durationDays}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="any"
            min={summary?.minStakeAmount ?? 50}
            required
            placeholder={`Amount (min ${summary?.minStakeAmount ?? 50})`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-slate-700 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {previewTier && (
          <p className="text-xs text-slate-500">
            {previewTier.label} tier → <span className="text-emerald-400">{(previewTier.dailyRate * 100).toFixed(2)}%/day</span>
          </p>
        )}

        <button
          type="submit"
          disabled={stakeBusy}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 text-sm font-semibold rounded-lg py-1.5 transition"
        >
          {stakeBusy ? 'Staking…' : 'Stake'}
        </button>
      </form>

      {summary?.stakes?.length > 0 && (
        <div className="pt-2 border-t border-slate-700/50 space-y-2">
          <div className="text-xs text-slate-500">Your Stakes</div>
          {withdrawError && <p className="text-red-400 text-xs">{withdrawError}</p>}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {summary.stakes.map((s) => (
              <div key={s.id} className="bg-slate-900/40 rounded-lg p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-white font-mono font-semibold">
                    {Number(s.principal).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT
                  </span>
                  <span className="text-slate-500">
                    {s.durationDays}d @ {(s.dailyRate * 100).toFixed(2)}%/day
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>{s.daysElapsed}/{s.durationDays} days</span>
                  <span className="text-emerald-400">+{Number(s.accruedInterest).toFixed(4)} interest</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={s.matured ? 'text-emerald-400' : 'text-amber-400'}>
                    {s.matured ? 'Matured — ready to withdraw' : `Locked until ${formatDate(s.maturesAt)}`}
                  </span>
                  <button
                    onClick={() => handleWithdraw(s.id)}
                    disabled={!s.matured || withdrawBusy || withdrawingId === s.id}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-900 font-semibold rounded px-2 py-1 transition"
                  >
                    {withdrawingId === s.id ? 'Withdrawing…' : 'Withdraw'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
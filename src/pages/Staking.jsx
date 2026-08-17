import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import NavBar from '../components/NavBar';
import StakingPanel from '../components/StakingPanel';

function formatDate(d) {
  return new Date(d).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Staking() {
  const { accessToken } = useAuth();
  const [staking, setStaking] = useState(null);
  const [history, setHistory] = useState([]);
  const [stakeBusy, setStakeBusy] = useState(false);
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const refreshStaking = useCallback(async () => {
    const data = await api.getStaking(accessToken);
    setStaking(data);
  }, [accessToken]);

  const refreshHistory = useCallback(async () => {
    const data = await api.getStakingHistory(accessToken);
    setHistory(data.withdrawals);
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.all([refreshStaking(), refreshHistory()])
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || 'Failed to load staking data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshStaking, refreshHistory]);

  async function handleStake(payload) {
    setStakeBusy(true);
    try {
      await api.stake(accessToken, payload);
      await refreshStaking();
    } finally {
      setStakeBusy(false);
    }
  }

  async function handleWithdrawStaking(payload) {
    setWithdrawBusy(true);
    try {
      await api.withdrawStaking(accessToken, payload);
      await Promise.all([refreshStaking(), refreshHistory()]);
    } finally {
      setWithdrawBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 space-y-6 pb-24 sm:pb-6">
      <NavBar />

      {loadError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-4">
          {loadError}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : (
        <>
          <StakingPanel
            summary={staking}
            onStake={handleStake}
            onWithdraw={handleWithdrawStaking}
            stakeBusy={stakeBusy}
            withdrawBusy={withdrawBusy}
          />

          <div className="bg-slate-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
              Staking History
            </h2>
            {history.length === 0 ? (
              <p className="text-slate-500 text-sm">No completed stakes yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[480px] divide-y divide-slate-700/50">
                  <div className="grid grid-cols-4 text-xs text-slate-500 pb-2">
                    <span>Date</span>
                    <span className="text-right">Principal</span>
                    <span className="text-right">Interest</span>
                    <span className="text-right">Total</span>
                  </div>
                  {history.map((h) => (
                    <div key={h.id} className="grid grid-cols-4 items-center text-sm py-2">
                      <span className="text-slate-400 text-xs">{formatDate(h.createdAt)}</span>
                      <span className="text-right font-mono">
                        {Number(h.principal).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-right font-mono text-emerald-400">
                        +{Number(h.interest).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </span>
                      <span className="text-right font-mono font-semibold">
                        {Number(h.total).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { usePrices } from '../hooks/usePrices';
import NavBar from '../components/NavBar';
import WalletPanel from '../components/WalletPanel';

function usdFormat(n) {
  return Number(n).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
}

export default function Balance() {
  const { accessToken } = useAuth();
  const { prices } = usePrices();

  const [wallets, setWallets] = useState([]);
  const [staking, setStaking] = useState(null);
  const [walletBusy, setWalletBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const refreshWallet = useCallback(async () => {
    const data = await api.getWallet(accessToken);
    setWallets(data.wallets);
  }, [accessToken]);

  const refreshStaking = useCallback(async () => {
    const data = await api.getStaking(accessToken);
    setStaking(data);
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.all([refreshWallet(), refreshStaking()])
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || 'Failed to load your balances.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshWallet, refreshStaking]);

  const rows = useMemo(() => {
    return wallets.map((w) => {
      const price = w.asset === 'USDT' ? 1 : Number(prices[`${w.asset}USDT`]?.price) || 0;
      const total = Number(w.balance) + Number(w.locked_balance);
      return { ...w, price, usdValue: total * price };
    });
  }, [wallets, prices]);

  const walletUsdTotal = rows.reduce((sum, r) => sum + r.usdValue, 0);
  const stakedUsdTotal = staking ? Number(staking.totalPrincipal) + Number(staking.totalAccruedInterest) : 0;
  const portfolioTotal = walletUsdTotal + stakedUsdTotal;

  async function handleDeposit(payload) {
    setWalletBusy(true);
    try {
      await api.deposit(accessToken, payload);
      await refreshWallet();
    } finally {
      setWalletBusy(false);
    }
  }

  async function handleWithdraw(payload) {
    setWalletBusy(true);
    try {
      await api.withdraw(accessToken, payload);
      await refreshWallet();
    } finally {
      setWalletBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 space-y-6 pb-24 sm:pb-6">
      <NavBar />

      {loadError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-4">
          {loadError} — is the backend running?
        </div>
      )}

      <div className="bg-linear-to-br from-slate-800 to-slate-800/60 rounded-xl p-6">
        <div className="text-sm text-slate-400 uppercase tracking-wide">Total Portfolio Value</div>
        <div className="text-3xl sm:text-4xl font-bold font-mono mt-1">
          {loading ? '—' : usdFormat(portfolioTotal)}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm text-slate-400">
          <span>
            Wallet: <span className="text-white font-mono">{usdFormat(walletUsdTotal)}</span>
          </span>
          <span>
            Staked + Interest: <span className="text-white font-mono">{usdFormat(stakedUsdTotal)}</span>
          </span>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Assets</h2>
        {loading && <p className="text-slate-500 text-sm">Loading…</p>}
        {!loading && rows.length === 0 && <p className="text-slate-500 text-sm">No balances yet.</p>}
        {!loading && rows.length > 0 && (
          <div className="overflow-x-auto">
            <div className="min-w-[420px] divide-y divide-slate-700/50">
              <div className="grid grid-cols-4 text-xs text-slate-500 pb-2">
                <span>Asset</span>
                <span className="text-right">Available</span>
                <span className="text-right">Locked</span>
                <span className="text-right">Value (USD)</span>
              </div>
              {rows.map((r) => (
                <div key={r.asset} className="grid grid-cols-4 items-center text-sm py-2">
                  <span className="font-medium text-slate-200">{r.asset}</span>
                  <span className="text-right font-mono">
                    {Number(r.balance).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                  </span>
                  <span className="text-right font-mono text-amber-400">
                    {Number(r.locked_balance) > 0
                      ? Number(r.locked_balance).toLocaleString(undefined, { maximumFractionDigits: 8 })
                      : '—'}
                  </span>
                  <span className="text-right font-mono">{usdFormat(r.usdValue)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WalletPanel wallets={wallets} onDeposit={handleDeposit} onWithdraw={handleWithdraw} busy={walletBusy} />

        <div className="bg-slate-800 rounded-xl p-4 space-y-4 flex flex-col">
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
                {staking ? Number(staking.totalPrincipal).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
              </div>
            </div>
            <div className="bg-slate-900/40 rounded-lg p-3">
              <div className="text-xs text-slate-500">Unclaimed Interest</div>
              <div className="text-lg font-mono text-emerald-400">
                {staking
                  ? Number(staking.totalAccruedInterest).toLocaleString(undefined, { maximumFractionDigits: 4 })
                  : '—'}
              </div>
            </div>
          </div>
          <Link
            to="/staking"
            className="mt-auto w-full text-center bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-sm font-semibold rounded-lg py-2 transition"
          >
            Manage Staking →
          </Link>
        </div>
      </div>
    </div>
  );
}
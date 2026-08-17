export default function TradeHistory({ trades }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Trade History</h2>

      {trades.length === 0 && <p className="text-slate-500 text-sm">No trades yet.</p>}

      <div className="space-y-1 max-h-80 overflow-y-auto">
        {trades.map((t) => (
          <div key={t.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-700/50 last:border-0">
            <div>
              <span className={`font-semibold ${t.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{t.side}</span>
              <span className="text-white ml-2">{t.symbol}</span>
            </div>
            <div className="text-right font-mono text-slate-300">
              {Number(t.quantity).toFixed(6)} @ {Number(t.price).toLocaleString()}
              <div className="text-slate-500">{new Date(t.executed_at).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
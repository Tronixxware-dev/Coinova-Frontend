export default function OrdersList({ orders, onCancel, cancellingId }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Your Orders</h2>

      {orders.length === 0 && <p className="text-slate-500 text-sm">No orders yet.</p>}

      <div className="space-y-1 max-h-80 overflow-y-auto">
        {orders.map((o) => (
          <div key={o.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-700/50 last:border-0">
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${o.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{o.side}</span>
                <span className="text-white">{o.symbol}</span>
                <span className="text-slate-500">{o.type.replace('_', ' ')}</span>
              </div>
              <div className="text-slate-400 font-mono mt-0.5">
                {Number(o.quantity).toFixed(6)}
                {o.price ? ` @ ${Number(o.price).toLocaleString()}` : ''}
                {o.stop_price ? ` (stop ${Number(o.stop_price).toLocaleString()})` : ''}
              </div>
            </div>
            <div className="text-right">
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  o.status === 'FILLED'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : o.status === 'CANCELLED'
                    ? 'bg-slate-700 text-slate-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {o.status}
              </span>
              {o.status === 'PENDING' && (
                <button
                  onClick={() => onCancel(o.id)}
                  disabled={cancellingId === o.id}
                  className="block mt-1 text-red-400 hover:text-red-300 disabled:opacity-50 text-xs underline"
                >
                  {cancellingId === o.id ? 'Cancelling…' : 'Cancel'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default function OrderBook({ symbol, book }) {
  if (!book) {
    return (
      <div className="bg-slate-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Order Book — {symbol}</h2>
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Order Book — {symbol}</h2>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <div className="flex justify-between text-slate-500 mb-1 px-1">
            <span>Price (bid)</span>
            <span>Qty</span>
          </div>
          <div className="space-y-0.5">
            {book.bids.length === 0 && <p className="text-slate-600 px-1">No bids</p>}
            {book.bids.map((b) => (
              <div key={b.price} className="flex justify-between px-1 py-0.5 rounded bg-emerald-500/5 font-mono">
                <span className="text-emerald-400">{Number(b.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                <span className="text-slate-300">{Number(b.quantity).toFixed(6)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-slate-500 mb-1 px-1">
            <span>Price (ask)</span>
            <span>Qty</span>
          </div>
          <div className="space-y-0.5">
            {book.asks.length === 0 && <p className="text-slate-600 px-1">No asks</p>}
            {book.asks.map((a) => (
              <div key={a.price} className="flex justify-between px-1 py-0.5 rounded bg-red-500/5 font-mono">
                <span className="text-red-400">{Number(a.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                <span className="text-slate-300">{Number(a.quantity).toFixed(6)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
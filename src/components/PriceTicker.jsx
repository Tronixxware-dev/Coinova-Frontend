const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];

export default function PriceTicker({ prices, connected, selectedSymbol, onSelectSymbol }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Live Prices</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full ${connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
          {connected ? 'Live' : 'Connecting…'}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {SYMBOLS.map((symbol) => {
          const entry = prices[symbol];
          const price = entry ? Number(entry.price) : null;
          const prevPrice = entry?.prevPrice ? Number(entry.prevPrice) : null;
          const direction = price != null && prevPrice != null ? (price > prevPrice ? 'up' : price < prevPrice ? 'down' : null) : null;

          return (
            <button
              key={symbol}
              onClick={() => onSelectSymbol(symbol)}
              className={`text-left rounded-lg p-3 border transition ${
                selectedSymbol === symbol ? 'border-emerald-500 bg-slate-700/60' : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
              }`}
            >
              <div className="text-xs text-slate-400">{symbol}</div>
              <div
                className={`text-lg font-mono font-semibold ${
                  direction === 'up' ? 'text-emerald-400' : direction === 'down' ? 'text-red-400' : 'text-white'
                }`}
              >
                {price != null ? `$${price.toLocaleString(undefined, { maximumFractionDigits: 8 })}` : '—'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
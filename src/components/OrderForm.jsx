import { useState } from 'react';

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];

export default function OrderForm({ symbol, onSymbolChange, currentPrice, onSubmit, busy }) {
  const [side, setSide] = useState('BUY');
  const [type, setType] = useState('MARKET');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    try {
      const payload = { symbol, side, type, quantity };
      if (type === 'LIMIT') payload.price = price;
      if (type === 'STOP_LOSS') payload.stopPrice = stopPrice;

      const result = await onSubmit(payload);
      setFormSuccess(
        result.order.status === 'FILLED'
          ? `Filled at $${Number(result.order.filled_price).toLocaleString()}`
          : 'Order placed and pending.'
      );
      setQuantity('');
      setPrice('');
      setStopPrice('');
    } catch (err) {
      setFormError(err.message);
    }
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 space-y-4">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Place Order</h2>

      <select
        value={symbol}
        onChange={(e) => onSymbolChange(e.target.value)}
        className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none"
      >
        {SYMBOLS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {currentPrice && (
        <p className="text-xs text-slate-400">
          Current price: <span className="font-mono text-white">${Number(currentPrice).toLocaleString(undefined, { maximumFractionDigits: 8 })}</span>
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSide('BUY')}
          className={`flex-1 text-sm font-semibold rounded-lg py-2 transition ${
            side === 'BUY' ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-300'
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setSide('SELL')}
          className={`flex-1 text-sm font-semibold rounded-lg py-2 transition ${
            side === 'SELL' ? 'bg-red-500 text-slate-900' : 'bg-slate-700 text-slate-300'
          }`}
        >
          Sell
        </button>
      </div>

      <div className="flex gap-2">
        {['MARKET', 'LIMIT', 'STOP_LOSS'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 text-xs font-medium rounded-lg py-1.5 transition ${
              type === t ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-400'
            }`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Quantity ({symbol.replace('USDT', '')})</label>
          <input
            type="number"
            step="any"
            min="0"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {type === 'LIMIT' && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Limit price (USDT)</label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}

        {type === 'STOP_LOSS' && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Stop price (USDT)</label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}

        {formError && <p className="text-red-400 text-xs">{formError}</p>}
        {formSuccess && <p className="text-emerald-400 text-xs">{formSuccess}</p>}

        <button
          type="submit"
          disabled={busy}
          className={`w-full font-semibold rounded-lg py-2 text-sm transition disabled:opacity-50 ${
            side === 'BUY' ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-900' : 'bg-red-500 hover:bg-red-400 text-slate-900'
          }`}
        >
          {busy ? 'Placing…' : `${side === 'BUY' ? 'Buy' : 'Sell'} ${symbol.replace('USDT', '')}`}
        </button>
      </form>
    </div>
  );
}
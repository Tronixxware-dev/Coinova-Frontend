import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { usePrices } from '../hooks/usePrices';
import NavBar from '../components/NavBar';
import PriceTicker from '../components/PriceTicker';
import OrderForm from '../components/OrderForm';
import OrderBook from '../components/OrderBook';
import OrdersList from '../components/OrdersList';
import TradeHistory from '../components/TradeHistory';

export default function Trade() {
  const { accessToken } = useAuth();
  const { prices, connected } = usePrices();

  const [symbol, setSymbol] = useState('BTCUSDT');
  const [orders, setOrders] = useState([]);
  const [trades, setTrades] = useState([]);
  const [book, setBook] = useState(null);
  const [orderBusy, setOrderBusy] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [bookError, setBookError] = useState(null);
  const [cancelError, setCancelError] = useState(null);

  const refreshOrders = useCallback(async () => {
    const data = await api.getOrders(accessToken);
    setOrders(data.orders);
  }, [accessToken]);

  const refreshTrades = useCallback(async () => {
    const data = await api.getTrades(accessToken);
    setTrades(data.trades);
  }, [accessToken]);

  const refreshBook = useCallback(async () => {
    try {
      const data = await api.getOrderBook(accessToken, symbol);
      setBook(data);
      setBookError(null);
    } catch (err) {
      // Don't let a single failed poll wipe the last-known book off the
      // screen — just surface that it's stale instead of freezing on
      // "Loading…" forever or spamming an unhandled rejection every 5s.
      setBookError(err.message || 'Failed to load the order book.');
    }
  }, [accessToken, symbol]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.all([refreshOrders(), refreshTrades()])
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || 'Failed to load your orders and trades.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshOrders, refreshTrades]);

  useEffect(() => {
    refreshBook();
  }, [refreshBook]);

  useEffect(() => {
    const interval = setInterval(refreshBook, 5000);
    return () => clearInterval(interval);
  }, [refreshBook]);

  async function handlePlaceOrder(payload) {
    setOrderBusy(true);
    try {
      const result = await api.placeOrder(accessToken, payload);
      await Promise.all([refreshOrders(), refreshBook()]);
      return result;
    } finally {
      setOrderBusy(false);
    }
  }

  async function handleCancelOrder(id) {
    setCancellingId(id);
    setCancelError(null);
    try {
      await api.cancelOrder(accessToken, id);
      await Promise.all([refreshOrders(), refreshBook()]);
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel that order.');
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 space-y-6">
      <NavBar />

      {loadError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-4">
          {loadError} — is the backend running?
        </div>
      )}
      {!connected && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm rounded-xl p-4">
          Live price feed disconnected — reconnecting…
        </div>
      )}

      <PriceTicker prices={prices} connected={connected} selectedSymbol={symbol} onSelectSymbol={setSymbol} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderForm
          symbol={symbol}
          onSymbolChange={setSymbol}
          currentPrice={prices[symbol]?.price}
          onSubmit={handlePlaceOrder}
          busy={orderBusy}
        />
        <div className="space-y-2">
          {bookError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-3 py-2">
              {bookError} — showing last known order book.
            </div>
          )}
          <OrderBook symbol={symbol} book={book} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          {cancelError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-3 py-2">
              {cancelError}
            </div>
          )}
          <OrdersList
            orders={loading ? [] : orders}
            onCancel={handleCancelOrder}
            cancellingId={cancellingId}
          />
        </div>
        <TradeHistory trades={loading ? [] : trades} />
      </div>
    </div>
  );
}
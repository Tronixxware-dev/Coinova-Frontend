import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';
const RECONNECT_DELAY_MS = 3000;

export function usePrices() {
  const { accessToken } = useAuth();
  const [prices, setPrices] = useState({});
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    if (!accessToken) return;

    let stopped = false;

    function connect() {
      const socket = new WebSocket(`${WS_BASE_URL}/ws/prices?token=${accessToken}`);
      socketRef.current = socket;

      socket.onopen = () => setConnected(true);

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type !== 'price') return;
        setPrices((prev) => ({
          ...prev,
          [data.symbol]: { price: data.price, timestamp: data.timestamp, prevPrice: prev[data.symbol]?.price },
        }));
      };

      socket.onclose = () => {
        setConnected(false);
        if (!stopped) {
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };

      socket.onerror = () => socket.close();
    }

    connect();

    return () => {
      stopped = true;
      clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
    };
  }, [accessToken]);

  return { prices, connected };
}
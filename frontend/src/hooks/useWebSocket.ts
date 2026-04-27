import { useEffect, useRef, useCallback } from 'react';

interface StockUpdateEvent {
  type:          'STOCK_UPDATE' | 'CONNECTED';
  id_pharmacie?: number;
  id_medicament?: number;
  nom_commercial?: string;
  quantite?:     number;
  statut?:       string;
  date_maj?:     string;
}

export const useWebSocket = (onStockUpdate: (data: StockUpdateEvent) => void) => {
  const ws        = useRef<WebSocket | null>(null);
  const reconnect = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    const url = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('WebSocket connecté');
      if (reconnect.current) clearTimeout(reconnect.current);
    };

    ws.current.onmessage = (event) => {
      try {
        const data: StockUpdateEvent = JSON.parse(event.data);
        onStockUpdate(data);
      } catch { /* ignore */ }
    };

    ws.current.onclose = () => {
      // Reconnexion automatique après 3 secondes
      reconnect.current = setTimeout(connect, 3000);
    };

    ws.current.onerror = () => {
      ws.current?.close();
    };
  }, [onStockUpdate]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnect.current) clearTimeout(reconnect.current);
      ws.current?.close();
    };
  }, [connect]);
};

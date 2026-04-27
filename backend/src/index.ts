import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer } from 'ws';
import rateLimit from 'express-rate-limit';

import { testConnection } from './config/db';
import router from './routes';

dotenv.config();

// ============================================================
//  App Express
// ============================================================
const app  = express();
const PORT = parseInt(process.env.PORT || '3000');

// ---- Middlewares globaux -----------------------------------
app.use(cors({
  origin:      process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Rate limiting ----------------------------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      200,
  message:  { success: false, message: 'Trop de requêtes, réessayez dans 15 minutes.' },
});
app.use('/api', limiter);

// ---- Routes -----------------------------------------------
app.use('/api', router);

// ---- Route santé ------------------------------------------
app.get('/health', (_req, res) => {
  res.json({
    status:  'ok',
    service: 'PharmaStock API',
    version: '1.0.0',
    env:     process.env.NODE_ENV,
  });
});

// ---- 404 --------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route introuvable' });
});

// ============================================================
//  Serveur HTTP + WebSocket
// ============================================================
const server = http.createServer(app);

export const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('🔌 Nouveau client WebSocket connecté');

  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'PharmaStock WebSocket actif' }));

  ws.on('close', () => {
    console.log('🔌 Client WebSocket déconnecté');
  });

  ws.on('error', (err) => {
    console.error('Erreur WebSocket :', err);
  });
});

// ============================================================
//  Démarrage
// ============================================================
const start = async (): Promise<void> => {
  await testConnection();

  server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📡 WebSocket actif sur ws://localhost:${PORT}`);
    console.log(`🌍 Environnement : ${process.env.NODE_ENV}`);
  });
};

start();

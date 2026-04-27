import { Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../types';
import { wss } from '../index';
import WebSocket from 'ws';

export const getStocks = async (req: AuthRequest, res: Response): Promise<void> => {
  const id_pharmacie = req.pharmacien?.id_pharmacie;

  try {
    const [rows] = await pool.query(
      `SELECT
         s.id_stock,
         m.id_medicament,
         m.nom_commercial,
         m.nom_generique,
         m.forme,
         m.dosage,
         m.type,
         GROUP_CONCAT(c.libelle SEPARATOR ', ') AS categories,
         s.quantite,
         s.statut,
         s.date_maj
       FROM stock s
       JOIN medicament m ON s.id_medicament = m.id_medicament
       LEFT JOIN medicament_categorie mc ON m.id_medicament = mc.id_medicament
       LEFT JOIN categorie c ON mc.id_categorie = c.id_categorie
       WHERE s.id_pharmacie = ?
       GROUP BY s.id_stock, m.id_medicament, m.nom_commercial, m.nom_generique,
                m.forme, m.dosage, m.type, s.quantite, s.statut, s.date_maj
       ORDER BY FIELD(s.statut,'stock_bas','indisponible','disponible'), m.nom_commercial`,
      [id_pharmacie]
    ) as any[];

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const updateStock = async (req: AuthRequest, res: Response): Promise<void> => {
  const id_pharmacie  = req.pharmacien?.id_pharmacie;
  const { id_medicament } = req.params;
  const { quantite }  = req.body;

  if (quantite === undefined || quantite < 0) {
    res.status(400).json({ success: false, message: 'Quantité invalide' });
    return;
  }

  try {
    const [existing] = await pool.query(
      'SELECT id_stock FROM stock WHERE id_pharmacie = ? AND id_medicament = ?',
      [id_pharmacie, id_medicament]
    ) as any[];

    if (existing.length) {
      await pool.query(
        'UPDATE stock SET quantite = ? WHERE id_pharmacie = ? AND id_medicament = ?',
        [quantite, id_pharmacie, id_medicament]
      );
    } else {
      await pool.query(
        'INSERT INTO stock (id_pharmacie, id_medicament, quantite) VALUES (?, ?, ?)',
        [id_pharmacie, id_medicament, quantite]
      );
    }

    const [updated] = await pool.query(
      `SELECT s.quantite, s.statut, s.date_maj, m.nom_commercial
       FROM stock s JOIN medicament m ON s.id_medicament = m.id_medicament
       WHERE s.id_pharmacie = ? AND s.id_medicament = ?`,
      [id_pharmacie, id_medicament]
    ) as any[];

    // Diffusion WebSocket à tous les clients connectés
    const payload = JSON.stringify({
      type:         'STOCK_UPDATE',
      id_pharmacie,
      id_medicament: Number(id_medicament),
      ...updated[0],
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });

    res.json({ success: true, message: 'Stock mis à jour', data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const getAlertes = async (req: AuthRequest, res: Response): Promise<void> => {
  const id_pharmacie = req.pharmacien?.id_pharmacie;

  try {
    const [rows] = await pool.query(
      `SELECT * FROM v_stocks_alertes WHERE id_pharmacie = ?`,
      [id_pharmacie]
    ) as any[];

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

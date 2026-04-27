import { Request, Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../types';

// PUBLIC — gardes du jour
export const getGardesAujourdhui = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM v_gardes_aujourd_hui'
    ) as any[];
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PUBLIC — gardes par période (calendrier)
export const getGardesPeriode = async (req: Request, res: Response): Promise<void> => {
  const { debut, fin } = req.query;

  if (!debut || !fin) {
    res.status(400).json({ success: false, message: 'Paramètres debut et fin requis (YYYY-MM-DD)' });
    return;
  }

  try {
    const [rows] = await pool.query(
      `SELECT
         g.id_garde,
         p.nom       AS pharmacie_nom,
         p.adresse,
         p.telephone,
         p.district,
         g.date_debut,
         g.date_fin,
         g.heure_debut,
         g.heure_fin
       FROM garde g
       JOIN pharmacie p ON g.id_pharmacie = p.id_pharmacie
       WHERE p.statut_validation = 'validee'
         AND g.date_debut <= ?
         AND g.date_fin   >= ?
       ORDER BY g.date_debut, g.heure_debut`,
      [fin, debut]
    ) as any[];

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PRIVÉ — mes gardes (pharmacien connecté)
export const getMesGardes = async (req: AuthRequest, res: Response): Promise<void> => {
  const id_pharmacie = req.pharmacien?.id_pharmacie;

  try {
    const [rows] = await pool.query(
      `SELECT id_garde, date_debut, date_fin, heure_debut, heure_fin, created_at
       FROM garde
       WHERE id_pharmacie = ? AND date_fin >= CURDATE()
       ORDER BY date_debut`,
      [id_pharmacie]
    ) as any[];

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PRIVÉ — créer une garde
export const createGarde = async (req: AuthRequest, res: Response): Promise<void> => {
  const id_pharmacie = req.pharmacien?.id_pharmacie;
  const { date_debut, date_fin, heure_debut, heure_fin } = req.body;

  if (!date_debut || !date_fin || !heure_debut || !heure_fin) {
    res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
    return;
  }

  if (new Date(date_debut) > new Date(date_fin)) {
    res.status(400).json({ success: false, message: 'La date de début doit être avant la date de fin' });
    return;
  }

  try {
    // Vérifier chevauchement avec une autre pharmacie
    const [conflit] = await pool.query(
      `SELECT g.id_garde, p.nom AS pharmacie_nom
       FROM garde g
       JOIN pharmacie p ON g.id_pharmacie = p.id_pharmacie
       WHERE g.id_pharmacie != ?
         AND g.date_debut <= ? AND g.date_fin >= ?`,
      [id_pharmacie, date_fin, date_debut]
    ) as any[];

    if (conflit.length > 0) {
      res.status(409).json({
        success: false,
        message: `Conflit de garde avec ${conflit[0].pharmacie_nom} sur cette période`,
      });
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO garde (id_pharmacie, date_debut, date_fin, heure_debut, heure_fin)
       VALUES (?, ?, ?, ?, ?)`,
      [id_pharmacie, date_debut, date_fin, heure_debut, heure_fin]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Garde enregistrée',
      data:    { id_garde: result.insertId, date_debut, date_fin, heure_debut, heure_fin },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PRIVÉ — supprimer une garde
export const deleteGarde = async (req: AuthRequest, res: Response): Promise<void> => {
  const id_pharmacie = req.pharmacien?.id_pharmacie;
  const { id }       = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT id_garde FROM garde WHERE id_garde = ? AND id_pharmacie = ?',
      [id, id_pharmacie]
    ) as any[];

    if (!rows.length) {
      res.status(404).json({ success: false, message: 'Garde introuvable ou non autorisée' });
      return;
    }

    await pool.query('DELETE FROM garde WHERE id_garde = ?', [id]);
    res.json({ success: true, message: 'Garde supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import { AuthRequest } from '../types';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe) {
    res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    return;
  }

  try {
    const [rows] = await pool.query(
      `SELECT ph.*, p.nom AS pharmacie_nom, p.statut_validation
       FROM pharmacien ph
       JOIN pharmacie p ON ph.id_pharmacie = p.id_pharmacie
       WHERE ph.email = ?`,
      [email]
    ) as any[];

    if (!rows.length) {
      res.status(401).json({ success: false, message: 'Identifiants incorrects' });
      return;
    }

    const pharmacien = rows[0];

    if (pharmacien.statut_validation !== 'validee') {
      res.status(403).json({ success: false, message: 'Pharmacie non validée par l\'administrateur' });
      return;
    }

    const match = await bcrypt.compare(mot_de_passe, pharmacien.mot_de_passe);
    if (!match) {
      res.status(401).json({ success: false, message: 'Identifiants incorrects' });
      return;
    }

    const payload = {
      id_pharmacien: pharmacien.id_pharmacien,
      nom:           pharmacien.nom,
      email:         pharmacien.email,
      id_pharmacie:  pharmacien.id_pharmacie,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || '', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    } as jwt.SignOptions);

    await pool.query(
      'UPDATE pharmacien SET jwt_token = ? WHERE id_pharmacien = ?',
      [token, pharmacien.id_pharmacien]
    );

    res.json({
      success: true,
      token,
      pharmacien: {
        id_pharmacien: pharmacien.id_pharmacien,
        nom:           pharmacien.nom,
        email:         pharmacien.email,
        id_pharmacie:  pharmacien.id_pharmacie,
        pharmacie_nom: pharmacien.pharmacie_nom,
      },
    });
  } catch (error) {
    console.error('Erreur login :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query(
      'UPDATE pharmacien SET jwt_token = NULL WHERE id_pharmacien = ?',
      [req.pharmacien?.id_pharmacien]
    );
    res.json({ success: true, message: 'Déconnexion réussie' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query(
      `SELECT ph.id_pharmacien, ph.nom, ph.email, ph.id_pharmacie,
              p.nom AS pharmacie_nom, p.adresse, p.district, p.telephone
       FROM pharmacien ph
       JOIN pharmacie p ON ph.id_pharmacie = p.id_pharmacie
       WHERE ph.id_pharmacien = ?`,
      [req.pharmacien?.id_pharmacien]
    ) as any[];

    if (!rows.length) {
      res.status(404).json({ success: false, message: 'Pharmacien introuvable' });
      return;
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

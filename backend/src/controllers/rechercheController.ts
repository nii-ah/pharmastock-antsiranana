import { Request, Response } from 'express';
import { pool } from '../config/db';

export const rechercheMedicament = async (req: Request, res: Response): Promise<void> => {
  const { q, district, type, statut } = req.query;

  if (!q || String(q).trim().length < 2) {
    res.status(400).json({ success: false, message: 'Terme de recherche trop court (min 2 caractères)' });
    return;
  }

  const terme = `%${String(q).trim()}%`;
  const params: any[] = [terme, terme];

  let whereExtra = '';
  if (district) { whereExtra += ' AND p.district = ?'; params.push(district); }
  if (type)     { whereExtra += ' AND m.type = ?';     params.push(type); }
  if (statut)   { whereExtra += ' AND s.statut = ?';   params.push(statut); }

  try {
    const [rows] = await pool.query(
      `SELECT
         p.id_pharmacie,
         p.nom           AS pharmacie_nom,
         p.adresse,
         p.district,
         p.telephone,
         p.latitude,
         p.longitude,
         p.heure_ouverture,
         p.heure_fermeture,
         m.id_medicament,
         m.nom_commercial,
         m.nom_generique,
         m.forme,
         m.dosage,
         m.type,
         s.quantite,
         s.statut,
         s.date_maj
       FROM stock s
       JOIN pharmacie  p ON s.id_pharmacie  = p.id_pharmacie
       JOIN medicament m ON s.id_medicament = m.id_medicament
       WHERE p.statut_validation = 'validee'
         AND (m.nom_commercial LIKE ? OR m.nom_generique LIKE ?)
         ${whereExtra}
       ORDER BY
         FIELD(s.statut, 'disponible', 'stock_bas', 'indisponible'),
         p.nom`,
      params
    ) as any[];

    // Log de la recherche
    if (rows.length > 0) {
      const premierMed = rows[0].id_medicament;
      pool.query(
        'INSERT INTO recherche (terme_recherche, id_medicament) VALUES (?, ?)',
        [String(q).trim(), premierMed]
      ).catch(() => {});
    } else {
      pool.query(
        'INSERT INTO recherche (terme_recherche, id_medicament) VALUES (?, NULL)',
        [String(q).trim()]
      ).catch(() => {});
    }

    res.json({
      success: true,
      count:   rows.length,
      terme:   String(q).trim(),
      data:    rows,
    });
  } catch (error) {
    console.error('Erreur recherche :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const getPharmacies = async (req: Request, res: Response): Promise<void> => {
  const { district } = req.query;
  const params: any[] = [];
  let whereDistrict = '';

  if (district) { whereDistrict = 'AND district = ?'; params.push(district); }

  try {
    const [rows] = await pool.query(
      `SELECT id_pharmacie, nom, adresse, district, telephone,
              latitude, longitude, heure_ouverture, heure_fermeture
       FROM pharmacie
       WHERE statut_validation = 'validee' ${whereDistrict}
       ORDER BY nom`,
      params
    ) as any[];

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const getPharmacieDetail = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const [pharmaRows] = await pool.query(
      `SELECT id_pharmacie, nom, adresse, district, telephone, email,
              latitude, longitude, heure_ouverture, heure_fermeture
       FROM pharmacie WHERE id_pharmacie = ? AND statut_validation = 'validee'`,
      [id]
    ) as any[];

    if (!pharmaRows.length) {
      res.status(404).json({ success: false, message: 'Pharmacie introuvable' });
      return;
    }

    const [stockRows] = await pool.query(
      `SELECT m.nom_commercial, m.nom_generique, m.forme, m.dosage, m.type,
              s.quantite, s.statut, s.date_maj
       FROM stock s
       JOIN medicament m ON s.id_medicament = m.id_medicament
       WHERE s.id_pharmacie = ?
       ORDER BY FIELD(s.statut,'disponible','stock_bas','indisponible'), m.nom_commercial`,
      [id]
    ) as any[];

    res.json({
      success: true,
      data: { ...pharmaRows[0], stocks: stockRows },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

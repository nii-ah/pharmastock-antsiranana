import { Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../types';

// Statistiques globales du dashboard
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const id_pharmacie = req.pharmacien?.id_pharmacie;

  try {
    // Total médicaments gérés
    const [totalRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM stock WHERE id_pharmacie = ?',
      [id_pharmacie]
    ) as any[];

    // Alertes stock bas
    const [alertesRows] = await pool.query(
      `SELECT COUNT(*) AS alertes FROM stock
       WHERE id_pharmacie = ? AND statut IN ('stock_bas','indisponible')`,
      [id_pharmacie]
    ) as any[];

    // Visites aujourd'hui (recherches qui ont retourné cette pharmacie)
    const [visitesRows] = await pool.query(
      `SELECT COUNT(*) AS visites
       FROM recherche r
       JOIN stock s ON r.id_medicament = s.id_medicament
       WHERE s.id_pharmacie = ?
         AND DATE(r.date_heure) = CURDATE()`,
      [id_pharmacie]
    ) as any[];

    // Prochaine garde
    const [gardeRows] = await pool.query(
      `SELECT date_debut, date_fin, heure_debut, heure_fin
       FROM garde
       WHERE id_pharmacie = ? AND date_debut >= CURDATE()
       ORDER BY date_debut LIMIT 1`,
      [id_pharmacie]
    ) as any[];

    // Médicaments en stock bas (liste détaillée pour l'alerte)
    const [stockBasRows] = await pool.query(
      `SELECT m.nom_commercial, s.quantite, s.statut
       FROM stock s
       JOIN medicament m ON s.id_medicament = m.id_medicament
       WHERE s.id_pharmacie = ? AND s.statut IN ('stock_bas','indisponible')
       ORDER BY s.quantite`,
      [id_pharmacie]
    ) as any[];

    res.json({
      success: true,
      data: {
        total_medicaments: totalRows[0].total,
        alertes:           alertesRows[0].alertes,
        visites_jour:      visitesRows[0].visites,
        prochaine_garde:   gardeRows[0] || null,
        stocks_alertes:    stockBasRows,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Top recherches sur N jours
export const getTopRecherches = async (req: AuthRequest, res: Response): Promise<void> => {
  const id_pharmacie = req.pharmacien?.id_pharmacie;
  const jours        = parseInt(String(req.query.jours) || '7');

  try {
    const [rows] = await pool.query(
      `SELECT
         m.id_medicament,
         m.nom_commercial,
         m.nom_generique,
         COUNT(r.id_recherche) AS nb_recherches,
         s.statut
       FROM recherche r
       JOIN medicament m ON r.id_medicament = m.id_medicament
       LEFT JOIN stock s ON s.id_medicament = m.id_medicament
                         AND s.id_pharmacie = ?
       WHERE r.date_heure >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY m.id_medicament, m.nom_commercial, m.nom_generique, s.statut
       ORDER BY nb_recherches DESC
       LIMIT 10`,
      [id_pharmacie, jours]
    ) as any[];

    res.json({ success: true, periode_jours: jours, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Visites par jour sur N jours
export const getVisitesParJour = async (req: AuthRequest, res: Response): Promise<void> => {
  const id_pharmacie = req.pharmacien?.id_pharmacie;
  const jours        = parseInt(String(req.query.jours) || '7');

  try {
    const [rows] = await pool.query(
      `SELECT
         DATE(r.date_heure)    AS jour,
         COUNT(r.id_recherche) AS nb_visites
       FROM recherche r
       JOIN stock s ON r.id_medicament = s.id_medicament
       WHERE s.id_pharmacie = ?
         AND r.date_heure >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(r.date_heure)
       ORDER BY jour`,
      [id_pharmacie, jours]
    ) as any[];

    res.json({ success: true, periode_jours: jours, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Stats globales publiques (pour la page d'accueil)
export const getStatsPubliques = async (_req: any, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM pharmacie WHERE statut_validation = 'validee') AS nb_pharmacies,
         (SELECT COUNT(*) FROM medicament)                                     AS nb_medicaments,
         (SELECT COUNT(*) FROM stock WHERE statut = 'disponible')              AS nb_stocks_dispos,
         (SELECT COUNT(*) FROM v_gardes_aujourd_hui)                           AS nb_gardes_jour`
    ) as any[];

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

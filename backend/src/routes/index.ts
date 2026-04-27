import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';

// Controllers
import { login, logout, me }                           from '../controllers/authController';
import { rechercheMedicament, getPharmacies,
         getPharmacieDetail }                          from '../controllers/rechercheController';
import { getStocks, updateStock, getAlertes }          from '../controllers/stockController';
import { getGardesAujourdhui, getGardesPeriode,
         getMesGardes, createGarde, deleteGarde }      from '../controllers/gardeController';
import { getDashboardStats, getTopRecherches,
         getVisitesParJour, getStatsPubliques }        from '../controllers/statsController';

const router = Router();

// ============================================================
//  AUTH — /api/auth
// ============================================================
router.post  ('/auth/login',  login);
router.post  ('/auth/logout', authMiddleware, logout);
router.get   ('/auth/me',     authMiddleware, me);

// ============================================================
//  PUBLIC — Recherche & Pharmacies
// ============================================================
router.get('/medicaments/recherche', rechercheMedicament);   // ?q=doliprane&district=centre
router.get('/pharmacies',            getPharmacies);          // ?district=port
router.get('/pharmacies/:id',        getPharmacieDetail);
router.get('/stats/publiques',       getStatsPubliques);

// ============================================================
//  PUBLIC — Gardes
// ============================================================
router.get('/gardes/aujourd-hui',    getGardesAujourdhui);
router.get('/gardes/periode',        getGardesPeriode);       // ?debut=2026-04-25&fin=2026-05-01

// ============================================================
//  PRIVÉ — Dashboard pharmacien (JWT requis)
// ============================================================
router.get   ('/dashboard/stats',            authMiddleware, getDashboardStats);
router.get   ('/dashboard/top-recherches',   authMiddleware, getTopRecherches);   // ?jours=7
router.get   ('/dashboard/visites-par-jour', authMiddleware, getVisitesParJour);  // ?jours=7

// Stocks
router.get   ('/stocks',                         authMiddleware, getStocks);
router.get   ('/stocks/alertes',                 authMiddleware, getAlertes);
router.put   ('/stocks/:id_medicament',          authMiddleware, updateStock);

// Gardes
router.get   ('/mes-gardes',      authMiddleware, getMesGardes);
router.post  ('/mes-gardes',      authMiddleware, createGarde);
router.delete('/mes-gardes/:id',  authMiddleware, deleteGarde);

export default router;

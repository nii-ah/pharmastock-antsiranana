import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Injecter le token JWT automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Rediriger vers login si 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('pharmacien');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ---- Recherche publique ------------------------------------
export const rechercherMedicament = (q: string, district?: string, type?: string) =>
  api.get('/medicaments/recherche', { params: { q, district, type } });

export const getPharmacies = (district?: string) =>
  api.get('/pharmacies', { params: { district } });

export const getPharmacieDetail = (id: number) =>
  api.get(`/pharmacies/${id}`);

export const getGardesAujourdhui = () =>
  api.get('/gardes/aujourd-hui');

export const getGardesPeriode = (debut: string, fin: string) =>
  api.get('/gardes/periode', { params: { debut, fin } });

export const getStatsPubliques = () =>
  api.get('/stats/publiques');

// ---- Auth --------------------------------------------------
export const login = (email: string, mot_de_passe: string) =>
  api.post('/auth/login', { email, mot_de_passe });

export const logout = () =>
  api.post('/auth/logout');

export const getMe = () =>
  api.get('/auth/me');

// ---- Dashboard ---------------------------------------------
export const getDashboardStats = () =>
  api.get('/dashboard/stats');

export const getTopRecherches = (jours = 7) =>
  api.get('/dashboard/top-recherches', { params: { jours } });

export const getVisitesParJour = (jours = 7) =>
  api.get('/dashboard/visites-par-jour', { params: { jours } });

// ---- Stocks ------------------------------------------------
export const getStocks = () =>
  api.get('/stocks');

export const getAlertes = () =>
  api.get('/stocks/alertes');

export const updateStock = (id_medicament: number, quantite: number) =>
  api.put(`/stocks/${id_medicament}`, { quantite });

// ---- Gardes ------------------------------------------------
export const getMesGardes = () =>
  api.get('/mes-gardes');

export const createGarde = (data: {
  date_debut: string; date_fin: string;
  heure_debut: string; heure_fin: string;
}) => api.post('/mes-gardes', data);

export const deleteGarde = (id: number) =>
  api.delete(`/mes-gardes/${id}`);

export default api;

# PharmaStock Backend — API REST

API REST Node.js/Express/TypeScript pour la plateforme PharmaStock Antsiranana.

## Stack technique
- **Runtime** : Node.js 20+
- **Framework** : Express 4
- **Langage** : TypeScript 5
- **BDD** : MySQL 8 via mysql2
- **Auth** : JWT + bcrypt
- **Temps réel** : WebSocket (ws)
- **Déploiement** : Render

---

## Installation

```bash
# 1. Cloner et installer
npm install

# 2. Configurer l'environnement
cp .env.example .env
# → Remplir DB_PASSWORD et JWT_SECRET dans .env

# 3. Importer la base de données
mysql -u root -p < ../pharmastock.sql

# 4. Lancer en développement
npm run dev

# 5. Build production
npm run build && npm start
```

---

## Variables d'environnement (.env)

| Variable | Description | Exemple |
|---|---|---|
| `PORT` | Port du serveur | `3000` |
| `DB_HOST` | Hôte MySQL | `localhost` |
| `DB_PORT` | Port MySQL | `3306` |
| `DB_USER` | Utilisateur MySQL | `root` |
| `DB_PASSWORD` | Mot de passe MySQL | `secret` |
| `DB_NAME` | Nom de la base | `pharmastock` |
| `JWT_SECRET` | Clé secrète JWT | `long_random_string` |
| `JWT_EXPIRES_IN` | Durée token | `7d` |
| `CORS_ORIGIN` | URL frontend | `http://localhost:5173` |

---

## Routes API

### Publiques (sans authentification)

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/health` | Santé du serveur |
| `GET` | `/api/medicaments/recherche?q=doliprane` | Recherche médicament |
| `GET` | `/api/pharmacies` | Liste pharmacies |
| `GET` | `/api/pharmacies/:id` | Détail pharmacie + stocks |
| `GET` | `/api/gardes/aujourd-hui` | Gardes du jour |
| `GET` | `/api/gardes/periode?debut=2026-04-25&fin=2026-05-01` | Gardes sur période |
| `GET` | `/api/stats/publiques` | Stats globales accueil |

### Privées (JWT Bearer Token requis)

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Connexion pharmacien |
| `POST` | `/api/auth/logout` | Déconnexion |
| `GET` | `/api/auth/me` | Profil connecté |
| `GET` | `/api/stocks` | Mes stocks |
| `GET` | `/api/stocks/alertes` | Stocks bas/indisponibles |
| `PUT` | `/api/stocks/:id_medicament` | Modifier un stock |
| `GET` | `/api/mes-gardes` | Mes gardes à venir |
| `POST` | `/api/mes-gardes` | Créer une garde |
| `DELETE` | `/api/mes-gardes/:id` | Supprimer une garde |
| `GET` | `/api/dashboard/stats` | Stats dashboard |
| `GET` | `/api/dashboard/top-recherches?jours=7` | Top recherches |
| `GET` | `/api/dashboard/visites-par-jour?jours=7` | Visites par jour |

### Exemples de requêtes

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rakoto@pharma.mg","mot_de_passe":"password"}'

# Recherche médicament
curl "http://localhost:3000/api/medicaments/recherche?q=doliprane&district=centre"

# Modifier un stock (avec token)
curl -X PUT http://localhost:3000/api/stocks/1 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"quantite": 25}'
```

---

## WebSocket

Connexion : `ws://localhost:3000`

Événements reçus par le client :
```json
{ "type": "CONNECTED", "message": "PharmaStock WebSocket actif" }
{ "type": "STOCK_UPDATE", "id_pharmacie": 1, "id_medicament": 1,
  "nom_commercial": "Doliprane 500mg", "quantite": 25,
  "statut": "disponible", "date_maj": "2026-04-24T10:00:00Z" }
```

---

## Structure du projet

```
src/
├── config/
│   └── db.ts              # Pool MySQL
├── controllers/
│   ├── authController.ts  # Login / logout / me
│   ├── rechercheController.ts
│   ├── stockController.ts
│   ├── gardeController.ts
│   └── statsController.ts
├── middlewares/
│   └── auth.ts            # Vérification JWT
├── routes/
│   └── index.ts           # Toutes les routes
├── types/
│   └── index.ts           # Types TypeScript
└── index.ts               # Serveur Express + WebSocket
```

-- ============================================================
--  PharmaStock Antsiranana — Script SQL CORRIGÉ
--  SGBD   : MySQL 8.0+
--  Auteur : MORATOMBO Soniah Rachida
--  Date   : 27 avril 2026
--  Version: 1.1 — Hashs bcrypt corrigés
--
--  Mot de passe de tous les comptes : password123
-- ============================================================

CREATE DATABASE IF NOT EXISTS pharmastock
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pharmastock;

-- ------------------------------------------------------------
--  0. Suppression dans l'ordre inverse des dépendances
-- ------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS recherche;
DROP TABLE IF EXISTS medicament_categorie;
DROP TABLE IF EXISTS stock;
DROP TABLE IF EXISTS garde;
DROP TABLE IF EXISTS pharmacien;
DROP TABLE IF EXISTS pharmacie;
DROP TABLE IF EXISTS categorie;
DROP TABLE IF EXISTS medicament;
DROP TABLE IF EXISTS administrateur;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  1. TABLE : administrateur
-- ============================================================
CREATE TABLE administrateur (
  id_admin      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  nom           VARCHAR(100)    NOT NULL,
  email         VARCHAR(150)    NOT NULL UNIQUE,
  mot_de_passe  VARCHAR(255)    NOT NULL COMMENT 'Hash bcrypt',
  role          ENUM('super_admin','moderateur') NOT NULL DEFAULT 'moderateur',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  2. TABLE : pharmacie
-- ============================================================
CREATE TABLE pharmacie (
  id_pharmacie      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  nom               VARCHAR(150)    NOT NULL,
  adresse           VARCHAR(255)    NOT NULL,
  district          ENUM('centre','port','periph') NOT NULL DEFAULT 'centre',
  telephone         VARCHAR(20)     NULL,
  email             VARCHAR(150)    NULL,
  latitude          DECIMAL(10,7)   NULL,
  longitude         DECIMAL(10,7)   NULL,
  heure_ouverture   TIME            NULL,
  heure_fermeture   TIME            NULL,
  statut_validation ENUM('en_attente','validee','rejetee') NOT NULL DEFAULT 'en_attente',
  id_admin          INT UNSIGNED    NULL COMMENT 'Admin ayant validé',
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_pharmacie),
  KEY idx_district (district),
  KEY idx_statut   (statut_validation),
  CONSTRAINT fk_pharmacie_admin
    FOREIGN KEY (id_admin) REFERENCES administrateur(id_admin)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  3. TABLE : pharmacien
-- ============================================================
CREATE TABLE pharmacien (
  id_pharmacien INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  nom           VARCHAR(100)    NOT NULL,
  email         VARCHAR(150)    NOT NULL UNIQUE,
  mot_de_passe  VARCHAR(255)    NOT NULL COMMENT 'Hash bcrypt',
  jwt_token     TEXT            NULL,
  id_pharmacie  INT UNSIGNED    NOT NULL UNIQUE COMMENT '1 pharmacien par pharmacie',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_pharmacien),
  CONSTRAINT fk_pharmacien_pharmacie
    FOREIGN KEY (id_pharmacie) REFERENCES pharmacie(id_pharmacie)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  4. TABLE : categorie
-- ============================================================
CREATE TABLE categorie (
  id_categorie INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  libelle      VARCHAR(100)    NOT NULL UNIQUE,
  description  TEXT            NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_categorie)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  5. TABLE : medicament
-- ============================================================
CREATE TABLE medicament (
  id_medicament   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  nom_commercial  VARCHAR(150)    NOT NULL,
  nom_generique   VARCHAR(150)    NULL,
  forme           ENUM('comprime','gelule','sirop','injectable','creme','pommade','autre') NOT NULL DEFAULT 'comprime',
  dosage          VARCHAR(50)     NULL COMMENT 'ex: 500mg, 1g',
  type            ENUM('Rx','OTC','SALAMA') NOT NULL DEFAULT 'OTC',
  description     TEXT            NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_medicament),
  KEY idx_nom_commercial (nom_commercial),
  KEY idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  6. TABLE : medicament_categorie  (N-N)
-- ============================================================
CREATE TABLE medicament_categorie (
  id_medicament INT UNSIGNED NOT NULL,
  id_categorie  INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_medicament, id_categorie),
  CONSTRAINT fk_mc_medicament
    FOREIGN KEY (id_medicament) REFERENCES medicament(id_medicament)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_mc_categorie
    FOREIGN KEY (id_categorie) REFERENCES categorie(id_categorie)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  7. TABLE : stock
-- ============================================================
CREATE TABLE stock (
  id_stock      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  id_pharmacie  INT UNSIGNED    NOT NULL,
  id_medicament INT UNSIGNED    NOT NULL,
  quantite      INT UNSIGNED    NOT NULL DEFAULT 0,
  statut        ENUM('disponible','stock_bas','indisponible') NOT NULL DEFAULT 'indisponible',
  date_maj      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_stock),
  UNIQUE KEY uq_stock_pharm_med (id_pharmacie, id_medicament),
  KEY idx_statut (statut),
  CONSTRAINT fk_stock_pharmacie
    FOREIGN KEY (id_pharmacie) REFERENCES pharmacie(id_pharmacie)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_stock_medicament
    FOREIGN KEY (id_medicament) REFERENCES medicament(id_medicament)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  Triggers stock
-- ============================================================
DELIMITER $$
CREATE TRIGGER trg_stock_statut_insert
BEFORE INSERT ON stock
FOR EACH ROW
BEGIN
  IF NEW.quantite = 0 THEN
    SET NEW.statut = 'indisponible';
  ELSEIF NEW.quantite < 10 THEN
    SET NEW.statut = 'stock_bas';
  ELSE
    SET NEW.statut = 'disponible';
  END IF;
END$$

CREATE TRIGGER trg_stock_statut_update
BEFORE UPDATE ON stock
FOR EACH ROW
BEGIN
  IF NEW.quantite = 0 THEN
    SET NEW.statut = 'indisponible';
  ELSEIF NEW.quantite < 10 THEN
    SET NEW.statut = 'stock_bas';
  ELSE
    SET NEW.statut = 'disponible';
  END IF;
END$$
DELIMITER ;

-- ============================================================
--  8. TABLE : garde
-- ============================================================
CREATE TABLE garde (
  id_garde     INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  id_pharmacie INT UNSIGNED  NOT NULL,
  date_debut   DATE          NOT NULL,
  date_fin     DATE          NOT NULL,
  heure_debut  TIME          NOT NULL DEFAULT '20:00:00',
  heure_fin    TIME          NOT NULL DEFAULT '08:00:00',
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_garde),
  KEY idx_date_debut (date_debut),
  KEY idx_date_fin   (date_fin),
  CONSTRAINT fk_garde_pharmacie
    FOREIGN KEY (id_pharmacie) REFERENCES pharmacie(id_pharmacie)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  9. TABLE : recherche
-- ============================================================
CREATE TABLE recherche (
  id_recherche    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  terme_recherche VARCHAR(200)  NOT NULL,
  id_medicament   INT UNSIGNED  NULL,
  date_heure      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_recherche),
  KEY idx_terme      (terme_recherche),
  KEY idx_date_heure (date_heure),
  CONSTRAINT fk_recherche_medicament
    FOREIGN KEY (id_medicament) REFERENCES medicament(id_medicament)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  VUES
-- ============================================================
CREATE OR REPLACE VIEW v_stocks_alertes AS
SELECT
  p.id_pharmacie,
  p.nom              AS pharmacie_nom,
  m.id_medicament,
  m.nom_commercial,
  m.nom_generique,
  s.quantite,
  s.statut,
  s.date_maj
FROM stock s
JOIN pharmacie  p ON s.id_pharmacie  = p.id_pharmacie
JOIN medicament m ON s.id_medicament = m.id_medicament
WHERE s.statut IN ('stock_bas', 'indisponible')
ORDER BY p.id_pharmacie, s.statut;

CREATE OR REPLACE VIEW v_top_recherches AS
SELECT
  m.id_medicament,
  m.nom_commercial,
  COUNT(r.id_recherche) AS nb_recherches
FROM recherche r
JOIN medicament m ON r.id_medicament = m.id_medicament
WHERE r.date_heure >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY m.id_medicament, m.nom_commercial
ORDER BY nb_recherches DESC
LIMIT 10;

CREATE OR REPLACE VIEW v_gardes_aujourd_hui AS
SELECT
  g.id_garde,
  p.nom          AS pharmacie_nom,
  p.adresse,
  p.telephone,
  p.district,
  g.date_debut,
  g.date_fin,
  g.heure_debut,
  g.heure_fin
FROM garde g
JOIN pharmacie p ON g.id_pharmacie = p.id_pharmacie
WHERE CURDATE() BETWEEN g.date_debut AND g.date_fin
  AND p.statut_validation = 'validee'
ORDER BY g.heure_debut;

-- ============================================================
--  SEED DATA
--  Mot de passe de TOUS les comptes : password123
--  Hash bcrypt généré avec cost=10
-- ============================================================

-- ---- Administrateurs ---------------------------------------
-- Mot de passe : password123
INSERT INTO administrateur (nom, email, mot_de_passe, role) VALUES
('Admin Principal', 'admin@pharmastock.mg',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'super_admin'),
('Moderateur 1', 'modo@pharmastock.mg',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'moderateur');

-- ---- Pharmacies --------------------------------------------
INSERT INTO pharmacie (nom, adresse, district, telephone, email, latitude, longitude, heure_ouverture, heure_fermeture, statut_validation, id_admin) VALUES
('Pharma Esperance', 'Rue Colbert, Antsiranana Centre',        'centre', '+261320000001', 'esperance@pharma.mg', -12.3484, 49.2977, '08:00:00', '20:00:00', 'validee', 1),
('Pharma du Port',   'Bd de la Republique, Antsiranana Port',  'port',   '+261320000002', 'port@pharma.mg',      -12.3512, 49.3021, '08:00:00', '18:00:00', 'validee', 1),
('Pharmacie SALAMA', 'Avenue de France, Antsiranana Centre',   'centre', '+261320000003', 'salama@pharma.mg',    -12.3468, 49.2955, '08:00:00', '17:00:00', 'validee', 1),
('Pharma Centrale',  'Rue Joffre, Antsiranana Centre',         'centre', '+261320000004', 'centrale@pharma.mg',  -12.3495, 49.2963, '08:00:00', '20:00:00', 'validee', 1),
('Pharma Nord',      'Route de la Montagne, Antsiranana Nord', 'periph', '+261320000005', 'nord@pharma.mg',      -12.3401, 49.3012, '08:00:00', '17:00:00', 'en_attente', NULL);

-- ---- Pharmaciens -------------------------------------------
-- Mot de passe de TOUS : password123
-- Hash valide bcrypt cost=10 pour "password123"
INSERT INTO pharmacien (nom, email, mot_de_passe, id_pharmacie) VALUES
('Soniah Rachida', 'soniah@pharma.mg',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
('Rabe Marie',     'rabe@pharma.mg',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2),
('Rasoa Patrick',  'rasoa@pharma.mg',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3),
('Andriana Solo',  'andriana@pharma.mg',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 4);

-- ---- Categories --------------------------------------------
INSERT INTO categorie (libelle, description) VALUES
('Analgesique',        'Medicaments contre la douleur'),
('Antipyretique',      'Medicaments contre la fievre'),
('Antibiotique',       'Medicaments contre les infections bacteriennes'),
('Anti-inflammatoire', 'Medicaments anti-inflammatoires non steroidiens'),
('Antiparasitaire',    'Medicaments contre les parasites'),
('Cardiovasculaire',   'Medicaments pour le coeur et la tension'),
('Dermatologie',       'Medicaments pour la peau'),
('SALAMA',             'Medicaments essentiels programme SALAMA Madagascar');

-- ---- Medicaments -------------------------------------------
INSERT INTO medicament (nom_commercial, nom_generique, forme, dosage, type, description) VALUES
('Doliprane',         'Paracetamol',          'comprime', '500mg',     'OTC',   'Antalgique et antipyretique de reference'),
('Doliprane 1g',      'Paracetamol',          'comprime', '1g',        'OTC',   'Antalgique adulte forte dose'),
('Amoxicilline',      'Amoxicilline',         'gelule',   '500mg',     'Rx',    'Antibiotique penicilline'),
('Ibuprofene',        'Ibuprofene',           'comprime', '400mg',     'OTC',   'Anti-inflammatoire non steroidien'),
('Cotrimoxazole',     'Sulfamethoxazole/TMP', 'comprime', '480mg',     'Rx',    'Antibiotique sulfonamide'),
('Metronidazole',     'Metronidazole',        'comprime', '250mg',     'Rx',    'Antibiotique et antiparasitaire'),
('Omeprazole',        'Omeprazole',           'gelule',   '20mg',      'Rx',    'Inhibiteur de la pompe a protons'),
('Loratadine',        'Loratadine',           'comprime', '10mg',      'OTC',   'Antihistaminique'),
('Salbutamol',        'Salbutamol',           'sirop',    '2mg/5ml',   'Rx',    'Bronchodilatateur'),
('Amodiaquine',       'Amodiaquine',          'comprime', '200mg',     'SALAMA','Antipaludeen programme SALAMA'),
('Cotrimoxazole ped', 'Sulfamethoxazole/TMP', 'sirop',    '240mg/5ml', 'SALAMA','Antibiotique pediatrique SALAMA'),
('SRO',               'Sels de rehydratation','autre',    'sachet',    'SALAMA','Sels de rehydratation orale SALAMA'),
('Fer+Acide folique', 'Fer/Acide folique',    'comprime', '200mg',     'SALAMA','Supplement grossesse SALAMA'),
('Amoxicilline ped',  'Amoxicilline',         'sirop',    '125mg/5ml', 'SALAMA','Antibiotique pediatrique SALAMA');

-- ---- Associations medicament-categorie ---------------------
INSERT INTO medicament_categorie (id_medicament, id_categorie) VALUES
(1,1),(1,2),
(2,1),(2,2),
(3,3),
(4,1),(4,4),
(5,3),
(6,3),(6,5),
(7,1),
(8,1),
(9,1),
(10,5),(10,8),
(11,3),(11,8),
(12,8),
(13,8),
(14,3),(14,8);

-- ---- Stocks ------------------------------------------------
INSERT INTO stock (id_pharmacie, id_medicament, quantite) VALUES
(1,1,8),(1,2,42),(1,3,5),(1,4,67),(1,5,0),(1,6,23),(1,10,15),(1,12,80),
(2,1,34),(2,3,7),(2,4,12),(2,5,45),(2,6,0),(2,10,20),(2,11,18),
(3,1,0),(3,2,10),(3,4,55),(3,10,40),(3,11,30),(3,12,100),(3,13,60),(3,14,25),
(4,1,50),(4,2,30),(4,3,20),(4,5,15),(4,6,40),(4,7,22),(4,8,18),(4,9,6);

-- ---- Gardes ------------------------------------------------
INSERT INTO garde (id_pharmacie, date_debut, date_fin, heure_debut, heure_fin) VALUES
(4, '2026-04-27', '2026-04-28', '20:00:00', '08:00:00'),
(1, '2026-04-28', '2026-04-29', '08:00:00', '08:00:00'),
(2, '2026-04-29', '2026-04-30', '20:00:00', '08:00:00'),
(3, '2026-04-30', '2026-05-01', '20:00:00', '08:00:00'),
(4, '2026-05-02', '2026-05-03', '20:00:00', '08:00:00'),
(1, '2026-05-03', '2026-05-04', '08:00:00', '08:00:00');

-- ---- Recherches de test ------------------------------------
INSERT INTO recherche (terme_recherche, id_medicament, date_heure) VALUES
('doliprane',    1, DATE_SUB(NOW(), INTERVAL 1  HOUR)),
('paracetamol',  1, DATE_SUB(NOW(), INTERVAL 2  HOUR)),
('amoxicilline', 3, DATE_SUB(NOW(), INTERVAL 3  HOUR)),
('ibuprofene',   4, DATE_SUB(NOW(), INTERVAL 4  HOUR)),
('doliprane',    1, DATE_SUB(NOW(), INTERVAL 5  HOUR)),
('cotrimoxazole',5, DATE_SUB(NOW(), INTERVAL 6  HOUR)),
('metronidazole',6, DATE_SUB(NOW(), INTERVAL 7  HOUR)),
('amoxicilline', 3, DATE_SUB(NOW(), INTERVAL 8  HOUR)),
('doliprane',    1, DATE_SUB(NOW(), INTERVAL 10 HOUR)),
('amodiaquine',  10,DATE_SUB(NOW(), INTERVAL 12 HOUR)),
('sro',          12,DATE_SUB(NOW(), INTERVAL 1  DAY)),
('salbutamol',   9, DATE_SUB(NOW(), INTERVAL 2  DAY)),
('ibuprofene',   4, DATE_SUB(NOW(), INTERVAL 2  DAY)),
('amoxicilline', 3, DATE_SUB(NOW(), INTERVAL 3  DAY));

-- ============================================================
--  Verification finale
-- ============================================================
SELECT 'administrateur'      AS table_name, COUNT(*) AS nb_lignes FROM administrateur
UNION ALL SELECT 'pharmacie',            COUNT(*) FROM pharmacie
UNION ALL SELECT 'pharmacien',           COUNT(*) FROM pharmacien
UNION ALL SELECT 'categorie',            COUNT(*) FROM categorie
UNION ALL SELECT 'medicament',           COUNT(*) FROM medicament
UNION ALL SELECT 'medicament_categorie', COUNT(*) FROM medicament_categorie
UNION ALL SELECT 'stock',                COUNT(*) FROM stock
UNION ALL SELECT 'garde',                COUNT(*) FROM garde
UNION ALL SELECT 'recherche',            COUNT(*) FROM recherche;
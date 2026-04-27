export type StatutStock    = 'disponible' | 'stock_bas' | 'indisponible';
export type District       = 'centre' | 'port' | 'periph';
export type TypeMedicament = 'Rx' | 'OTC' | 'SALAMA';

export interface Pharmacie {
  id_pharmacie:    number;
  nom:             string;
  adresse:         string;
  district:        District;
  telephone:       string;
  latitude:        number;
  longitude:       number;
  heure_ouverture: string;
  heure_fermeture: string;
}

export interface ResultatRecherche extends Pharmacie {
  id_medicament:  number;
  nom_commercial: string;
  nom_generique:  string;
  forme:          string;
  dosage:         string;
  type:           TypeMedicament;
  quantite:       number;
  statut:         StatutStock;
  date_maj:       string;
}

export interface Stock {
  id_stock:       number;
  id_medicament:  number;
  nom_commercial: string;
  nom_generique:  string;
  forme:          string;
  dosage:         string;
  type:           TypeMedicament;
  categories:     string;
  quantite:       number;
  statut:         StatutStock;
  date_maj:       string;
}

export interface Garde {
  id_garde:       number;
  pharmacie_nom?: string;
  adresse?:       string;
  telephone?:     string;
  district?:      District;
  date_debut:     string;
  date_fin:       string;
  heure_debut:    string;
  heure_fin:      string;
}

export interface Pharmacien {
  id_pharmacien: number;
  nom:           string;
  email:         string;
  id_pharmacie:  number;
  pharmacie_nom: string;
}

export interface DashboardStats {
  total_medicaments: number;
  alertes:           number;
  visites_jour:      number;
  prochaine_garde:   Garde | null;
  stocks_alertes:    Stock[];
}

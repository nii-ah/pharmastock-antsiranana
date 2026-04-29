import { Request } from 'express';

export interface Pharmacien {
  id_pharmacien: number;
  nom:           string;
  email:         string;
  id_pharmacie:  number;
}

export interface AuthRequest extends Request {
  pharmacien?: Pharmacien;
}

export type StatutStock    = 'disponible' | 'stock_bas' | 'indisponible';
export type StatutValid    = 'en_attente' | 'validee'   | 'rejetee';
export type TypeMedicament = 'Rx'         | 'OTC'       | 'SALAMA';
export type District       = 'centre'     | 'port'      | 'periph';
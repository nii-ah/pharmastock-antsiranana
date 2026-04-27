import { StatutStock } from '../../types';

interface BadgeProps { statut: StatutStock; }

const labels: Record<StatutStock, string> = {
  disponible:   'Disponible',
  stock_bas:    'Stock bas',
  indisponible: 'Indisponible',
};

export const Badge = ({ statut }: BadgeProps) => {
  const cls = {
    disponible:   'badge-ok',
    stock_bas:    'badge-low',
    indisponible: 'badge-no',
  }[statut];

  return <span className={cls}>{labels[statut]}</span>;
};

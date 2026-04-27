import { useState, useEffect } from 'react';
import { getGardesPeriode }   from '../../api';
import { Garde }              from '../../types';

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

export const GardesPage = () => {
  const today  = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [gardes, setGardes] = useState<Garde[]>([]);

  useEffect(() => {
    const debut = fmt(new Date(year, month, 1));
    const fin   = fmt(new Date(year, month + 1, 0));
    getGardesPeriode(debut, fin)
      .then(r => setGardes(r.data.data))
      .catch(() => {});
  }, [year, month]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11){ setMonth(0);  setYear(y => y+1); } else setMonth(m => m+1); };

  // Jours du mois avec gardes
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay    = (new Date(year, month, 1).getDay() + 6) % 7; // Lundi = 0

  const gardesByDay: Record<number, Garde[]> = {};
  gardes.forEach(g => {
    const start = new Date(g.date_debut);
    const end   = new Date(g.date_fin);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        if (!gardesByDay[day]) gardesByDay[day] = [];
        gardesByDay[day].push(g);
      }
    }
  });

  const moisLabel = new Date(year, month).toLocaleDateString('fr-FR', { month:'long', year:'numeric' });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-medium text-gray-900 mb-6">Calendrier des gardes</h1>

      <div className="grid sm:grid-cols-2 gap-6">

        {/* Calendrier */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="btn-ghost px-2 py-1">‹</button>
            <h2 className="font-medium text-gray-900 capitalize">{moisLabel}</h2>
            <button onClick={nextMonth} className="btn-ghost px-2 py-1">›</button>
          </div>

          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 mb-2">
            {['L','M','M','J','V','S','D'].map((j,i) => (
              <div key={i} className="text-center text-xs text-gray-400 py-1">{j}</div>
            ))}
          </div>

          {/* Jours */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i+1).map(day => {
              const isToday    = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const hasGarde   = !!gardesByDay[day];
              return (
                <div
                  key={day}
                  className={`h-8 flex items-center justify-center rounded-md text-xs font-medium transition-colors
                    ${isToday   ? 'bg-gray-100 text-gray-900' : ''}
                    ${hasGarde  ? 'bg-green-50 text-green-800 ring-1 ring-green-200' : 'text-gray-500'}
                  `}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Légende */}
          <div className="flex gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-50 ring-1 ring-green-200 inline-block"></span>
              Jour de garde
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gray-100 inline-block"></span>
              Aujourd'hui
            </span>
          </div>
        </div>

        {/* Liste des gardes */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3 text-sm">
            Gardes — {moisLabel}
          </h2>

          {gardes.length === 0 ? (
            <p className="text-sm text-gray-400 card">Aucune garde enregistrée pour ce mois.</p>
          ) : (
            <div className="space-y-2">
              {gardes.map(g => (
                <div key={g.id_garde} className="card flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{g.pharmacie_nom}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{g.adresse}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(g.date_debut).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' })}
                      {' '}{g.heure_debut?.slice(0,5)} → {' '}
                      {new Date(g.date_fin).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' })}
                      {' '}{g.heure_fin?.slice(0,5)}
                    </p>
                    {g.telephone && <p className="text-xs text-gray-400 mt-0.5">📞 {g.telephone}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center mt-8">
        Informations indicatives — Vérifiez toujours en officine avant de vous déplacer.
      </p>
    </div>
  );
};

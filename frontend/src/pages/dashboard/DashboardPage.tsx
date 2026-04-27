import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { getDashboardStats, getTopRecherches } from '../../api';
import { DashboardStats }      from '../../types';
import { Badge }               from '../../components/ui/Badge';
import { useAuth }             from '../../context/AuthContext';

export const DashboardPage = () => {
  const { pharmacien }             = useAuth();
  const navigate                   = useNavigate();
  const [stats,    setStats]        = useState<DashboardStats | null>(null);
  const [topRech,  setTopRech]      = useState<any[]>([]);
  const [loading,  setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getTopRecherches(7)])
      .then(([sRes, tRes]) => {
        setStats(sRes.data.data);
        setTopRech(tRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-sm text-gray-400">Chargement…</div>;
  if (!stats)  return <div className="p-8 text-sm text-red-500">Erreur de chargement.</div>;

  const statCards = [
    { label: 'Médicaments gérés',  value: stats.total_medicaments, color: 'bg-green-50 text-green-800' },
    { label: 'Stock bas / Indispo', value: stats.alertes,           color: 'bg-amber-50 text-amber-800' },
    { label: 'Visites aujourd\'hui',value: stats.visites_jour,      color: 'bg-teal-50 text-teal-800'  },
    {
      label: 'Prochaine garde',
      value: stats.prochaine_garde
        ? new Date(stats.prochaine_garde.date_debut).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' })
        : 'Aucune',
      color: 'bg-green-50 text-green-800',
    },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-lg font-medium text-gray-900">
          Bonjour, {pharmacien?.pharmacie_nom}
        </h1>
        <p className="text-sm text-gray-400">
          {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </p>
      </div>

      {/* Alerte stock bas */}
      {stats.alertes > 0 && (
        <div className="mb-6 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-medium text-amber-800">
              ⚠ {stats.alertes} médicament{stats.alertes > 1 ? 's' : ''} en stock bas
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {stats.stocks_alertes.slice(0,2).map(s => s.nom_commercial).join(' · ')}
              {stats.stocks_alertes.length > 2 ? ' …' : ''}
            </p>
          </div>
          <button onClick={() => navigate('/dashboard/stocks')} className="btn-outline text-xs px-3 py-1.5">
            Gérer les stocks
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-4 ${color}`}>
            <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
            <p className="text-xl font-medium">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Stocks alertes */}
        <div className="card">
          <h2 className="font-medium text-gray-900 mb-4 text-sm">Stocks à surveiller</h2>
          {stats.stocks_alertes.length === 0 ? (
            <p className="text-xs text-gray-400">Tous les stocks sont suffisants ✓</p>
          ) : (
            <div className="space-y-2">
              {stats.stocks_alertes.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.nom_commercial}</p>
                    <p className="text-xs text-gray-400">{s.quantite} unité{s.quantite > 1 ? 's' : ''}</p>
                  </div>
                  <Badge statut={s.statut} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top recherches */}
        <div className="card">
          <h2 className="font-medium text-gray-900 mb-4 text-sm">Top recherches (7 jours)</h2>
          {topRech.length === 0 ? (
            <p className="text-xs text-gray-400">Aucune donnée disponible.</p>
          ) : (
            <div className="space-y-2">
              {topRech.slice(0, 5).map((r, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-300 w-4">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{r.nom_commercial}</p>
                  </div>
                  <span className="text-xs font-medium text-gray-500">{r.nb_recherches}</span>
                  {r.statut && <Badge statut={r.statut} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

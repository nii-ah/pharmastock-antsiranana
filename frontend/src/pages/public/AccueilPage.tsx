import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { getStatsPubliques, getGardesAujourdhui } from '../../api';
import { Garde } from '../../types';

export const AccueilPage = () => {
  const [query,    setQuery]    = useState('');
  const [district, setDistrict] = useState('');
  const [stats,    setStats]    = useState<any>(null);
  const [garde,    setGarde]    = useState<Garde | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getStatsPubliques().then(r => setStats(r.data.data)).catch(() => {});
    getGardesAujourdhui().then(r => setGarde(r.data.data[0] || null)).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) return;
    navigate(`/recherche?q=${encodeURIComponent(query)}&district=${district}`);
  };

  const suggestions = ['Doliprane','Amoxicilline','Ibuprofène','Cotrimoxazole','Amodiaquine','SRO'];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="bg-white border-b border-gray-200 py-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-medium text-green-600 uppercase tracking-widest mb-2">
            Antsiranana · Stocks en temps réel
          </p>
          <h1 className="text-2xl font-medium text-gray-900 mb-2">
            Trouvez votre médicament rapidement
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Vérifiez la disponibilité dans toutes les pharmacies avant de vous déplacer.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nom commercial ou générique… ex: Doliprane"
              className="input flex-1"
            />
            <select
              value={district}
              onChange={e => setDistrict(e.target.value)}
              className="input sm:w-36"
            >
              <option value="">Tous districts</option>
              <option value="centre">Centre</option>
              <option value="port">Port</option>
              <option value="periph">Périphérie</option>
            </select>
            <button type="submit" className="btn-primary px-6">
              Rechercher
            </button>
          </form>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => navigate(`/recherche?q=${s}`)}
                className="px-3 py-1 text-xs border border-gray-200 rounded-full text-gray-500 hover:border-green-400 hover:text-green-800 hover:bg-green-50 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Bannière garde */}
      {garde && (
        <div className="bg-teal-50 border-b border-teal-400/30 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-teal-800 uppercase tracking-wider">
                Pharmacie de garde ce soir
              </span>
              <p className="text-sm font-medium text-teal-800 mt-0.5">
                {garde.pharmacie_nom} · {garde.heure_debut?.slice(0,5)} → {garde.heure_fin?.slice(0,5)}
              </p>
            </div>
            <button
              onClick={() => navigate('/gardes')}
              className="text-xs text-teal-600 font-medium hover:underline"
            >
              Voir le calendrier →
            </button>
          </div>
        </div>
      )}

      {/* Stats globales */}
      {stats && (
        <section className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Pharmacies actives',    value: stats.nb_pharmacies },
            { label: 'Médicaments référencés',value: stats.nb_medicaments },
            { label: 'Stocks disponibles',    value: stats.nb_stocks_dispos },
            { label: 'Gardes aujourd\'hui',   value: stats.nb_gardes_jour },
          ].map(({ label, value }) => (
            <div key={label} className="card text-center">
              <p className="text-2xl font-medium text-green-800">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </section>
      )}

      {/* Disclaimer */}
      <p className="text-center text-xs text-gray-400 pb-8 px-4">
        Informations indicatives — Vérifiez toujours en officine avant de vous déplacer.
      </p>
    </div>
  );
};

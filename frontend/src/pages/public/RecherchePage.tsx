import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate }     from 'react-router-dom';
import { rechercherMedicament }             from '../../api';
import { Badge }                            from '../../components/ui/Badge';
import { ResultatRecherche }                from '../../types';
import { useWebSocket }                     from '../../hooks/useWebSocket';

export const RecherchePage = () => {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  const [query,     setQuery]     = useState(searchParams.get('q') || '');
  const [district,  setDistrict]  = useState(searchParams.get('district') || '');
  const [type,      setType]      = useState('');
  const [resultats, setResultats] = useState<ResultatRecherche[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [searched,  setSearched]  = useState(false);

  const rechercher = useCallback(async (q: string, d: string, t: string) => {
    if (q.trim().length < 2) return;
    setLoading(true); setError(''); setSearched(true);
    try {
      const res = await rechercherMedicament(q, d || undefined, t || undefined);
      setResultats(res.data.data);
    } catch {
      setError('Erreur lors de la recherche. Réessayez.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Lancer la recherche au chargement si paramètre q présent
  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q) rechercher(q, district, type);
  }, []);  // eslint-disable-line

  // Mise à jour temps réel via WebSocket
  useWebSocket((data) => {
    if (data.type !== 'STOCK_UPDATE') return;
    setResultats(prev => prev.map(r =>
      r.id_pharmacie === data.id_pharmacie && r.id_medicament === data.id_medicament
        ? { ...r, quantite: data.quantite!, statut: data.statut as any, date_maj: data.date_maj! }
        : r
    ));
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rechercher(query, district, type);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Barre de recherche */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nom commercial ou générique…"
              className="input flex-1"
            />
            <select value={district} onChange={e => setDistrict(e.target.value)} className="input sm:w-36">
              <option value="">Tous districts</option>
              <option value="centre">Centre</option>
              <option value="port">Port</option>
              <option value="periph">Périphérie</option>
            </select>
            <select value={type} onChange={e => setType(e.target.value)} className="input sm:w-28">
              <option value="">Tous types</option>
              <option value="OTC">OTC</option>
              <option value="Rx">Rx</option>
              <option value="SALAMA">SALAMA</option>
            </select>
            <button type="submit" className="btn-primary px-6">Rechercher</button>
          </form>
        </div>
      </div>

      {/* Résultats */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading && (
          <div className="text-center py-16 text-gray-400 text-sm">Recherche en cours…</div>
        )}

        {error && (
          <div className="card border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>
        )}

        {!loading && searched && resultats.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">Aucune pharmacie ne dispose de ce médicament.</p>
            <button onClick={() => navigate('/')} className="btn-ghost mt-4 text-sm">
              Nouvelle recherche
            </button>
          </div>
        )}

        {resultats.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-900">{resultats.length}</span> pharmacie{resultats.length > 1 ? 's' : ''} trouvée{resultats.length > 1 ? 's' : ''} pour «&nbsp;{query}&nbsp;»
              </p>
              <button
                onClick={() => navigate(`/carte?q=${query}`)}
                className="btn-outline text-xs px-3 py-1.5"
              >
                Voir sur la carte
              </button>
            </div>

            <div className="grid gap-3">
              {resultats.map((r) => (
                <div
                  key={`${r.id_pharmacie}-${r.id_medicament}`}
                  className="card hover:border-green-200 transition-colors cursor-pointer"
                  onClick={() => navigate(`/pharmacies/${r.id_pharmacie}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">{r.nom}</h3>
                        <Badge statut={r.statut} />
                      </div>
                      <p className="text-xs text-gray-400 mb-2">{r.adresse}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>🕐 {r.heure_ouverture?.slice(0,5)} – {r.heure_fermeture?.slice(0,5)}</span>
                        <span>📍 {r.district}</span>
                        {r.telephone && <span>📞 {r.telephone}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400 mb-1">{r.nom_commercial} {r.dosage}</p>
                      {r.statut !== 'indisponible' && (
                        <p className="text-xs text-gray-500">{r.quantite} unité{r.quantite > 1 ? 's' : ''}</p>
                      )}
                      <p className="text-xs text-gray-300 mt-1">
                        Mis à jour {new Date(r.date_maj).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 pb-8 px-4">
        Informations indicatives — Vérifiez toujours en officine avant de vous déplacer.
      </p>
    </div>
  );
};

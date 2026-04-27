// ============================================================
//  GardesDashboardPage
// ============================================================
import { useState, useEffect, FormEvent } from 'react';
import { getMesGardes, createGarde, deleteGarde } from '../../api';
import { Garde } from '../../types';

export const GardesDashboardPage = () => {
  const [gardes,  setGardes]  = useState<Garde[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState('');
  const [form, setForm] = useState({
    date_debut: '', date_fin: '', heure_debut: '20:00', heure_fin: '08:00',
  });

  const load = () => {
    setLoading(true);
    getMesGardes().then(r => setGardes(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setMsg('');
    try {
      await createGarde(form);
      setMsg('Garde enregistrée ✓');
      setForm({ date_debut: '', date_fin: '', heure_debut: '20:00', heure_fin: '08:00' });
      load();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Erreur lors de l\'enregistrement.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette garde ?')) return;
    try { await deleteGarde(id); load(); } catch { setMsg('Erreur lors de la suppression.'); }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium text-gray-900">Mes gardes</h1>
        {msg && (
          <p className={`text-xs px-3 py-1.5 rounded-lg ${
            msg.includes('✓') ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
          }`}>{msg}</p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">

        {/* Formulaire */}
        <div className="card">
          <h2 className="font-medium text-gray-900 mb-4 text-sm">Inscrire une nouvelle garde</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { label: 'Date début',   field: 'date_debut',  type: 'date' },
              { label: 'Heure début',  field: 'heure_debut', type: 'time' },
              { label: 'Date fin',     field: 'date_fin',    type: 'date' },
              { label: 'Heure fin',    field: 'heure_fin',   type: 'time' },
            ].map(({ label, field, type }) => (
              <div key={field}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input
                  type={type} required
                  value={form[field as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  className="input"
                />
              </div>
            ))}

            {form.date_debut && form.date_fin && (
              <div className="bg-green-50 rounded-lg p-3 text-xs text-green-800">
                <p className="font-medium mb-0.5">Récapitulatif</p>
                <p>{form.date_debut} {form.heure_debut} → {form.date_fin} {form.heure_fin}</p>
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-2.5">
              Confirmer la garde
            </button>
          </form>
        </div>

        {/* Liste gardes à venir */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3 text-sm">Mes gardes à venir</h2>
          {loading ? (
            <p className="text-sm text-gray-400">Chargement…</p>
          ) : gardes.length === 0 ? (
            <p className="text-sm text-gray-400 card">Aucune garde planifiée.</p>
          ) : (
            <div className="space-y-2">
              {gardes.map(g => (
                <div key={g.id_garde} className="card flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(g.date_debut).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {g.heure_debut?.slice(0,5)} → {new Date(g.date_fin).toLocaleDateString('fr-FR',{ day:'numeric', month:'short' })} {g.heure_fin?.slice(0,5)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(g.id_garde)}
                    className="text-xs text-red-400 hover:text-red-600 flex-shrink-0"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
//  StatsPage
// ============================================================
import { getTopRecherches, getVisitesParJour } from '../../api';
import { Badge } from '../../components/ui/Badge';

export const StatsPage = () => {
  const [topRech,  setTopRech]  = useState<any[]>([]);
  const [visites,  setVisites]  = useState<any[]>([]);
  const [jours,    setJours]    = useState(7);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getTopRecherches(jours), getVisitesParJour(jours)])
      .then(([tRes, vRes]) => {
        setTopRech(tRes.data.data);
        setVisites(vRes.data.data);
      })
      .finally(() => setLoading(false));
  }, [jours]);

  const maxVisites = Math.max(...visites.map((v: any) => v.nb_visites), 1);

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium text-gray-900">Statistiques</h1>
        <select
          value={jours} onChange={e => setJours(parseInt(e.target.value))}
          className="input w-40 text-sm"
        >
          <option value={7}>7 derniers jours</option>
          <option value={14}>14 derniers jours</option>
          <option value={30}>30 derniers jours</option>
        </select>
      </div>

      {loading ? <p className="text-sm text-gray-400">Chargement…</p> : (
        <div className="grid sm:grid-cols-2 gap-6">

          {/* Graphique visites */}
          <div className="card">
            <h2 className="font-medium text-gray-900 mb-4 text-sm">Visites par jour</h2>
            {visites.length === 0 ? (
              <p className="text-xs text-gray-400">Aucune donnée disponible.</p>
            ) : (
              <div className="flex items-end gap-1.5 h-32">
                {visites.map((v: any, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-400">{v.nb_visites}</span>
                    <div
                      className="w-full rounded-t-sm bg-green-100 hover:bg-green-400 transition-colors"
                      style={{ height: `${(v.nb_visites / maxVisites) * 100}%` }}
                    ></div>
                    <span className="text-xs text-gray-400 truncate w-full text-center">
                      {new Date(v.jour).toLocaleDateString('fr-FR', { weekday:'narrow' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top recherches */}
          <div className="card">
            <h2 className="font-medium text-gray-900 mb-4 text-sm">
              Top médicaments recherchés
            </h2>
            {topRech.length === 0 ? (
              <p className="text-xs text-gray-400">Aucune donnée disponible.</p>
            ) : (
              <div className="space-y-2">
                {topRech.map((r: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                    <span className="text-xs text-gray-300 w-4 flex-shrink-0">{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{r.nom_commercial}</p>
                    </div>
                    <span className="text-xs font-medium text-gray-600 flex-shrink-0">
                      {r.nb_recherches} rech.
                    </span>
                    {r.statut && <Badge statut={r.statut} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

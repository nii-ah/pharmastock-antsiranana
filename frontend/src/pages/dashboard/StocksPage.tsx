import { useState, useEffect } from 'react';
import { getStocks, updateStock } from '../../api';
import { Stock }                  from '../../types';
import { Badge }                  from '../../components/ui/Badge';

export const StocksPage = () => {
  const [stocks,   setStocks]   = useState<Stock[]>([]);
  const [filtered, setFiltered] = useState<Stock[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState('');
  const [filtre,   setFiltre]   = useState('');
  const [editing,  setEditing]  = useState<Stock | null>(null);
  const [newQty,   setNewQty]   = useState(0);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');

  const load = () => {
    setLoading(true);
    getStocks()
      .then(r => { setStocks(r.data.data); setFiltered(r.data.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let list = stocks;
    if (query)  list = list.filter(s =>
      s.nom_commercial.toLowerCase().includes(query.toLowerCase()) ||
      (s.nom_generique || '').toLowerCase().includes(query.toLowerCase())
    );
    if (filtre) list = list.filter(s => s.statut === filtre);
    setFiltered(list);
  }, [query, filtre, stocks]);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true); setMsg('');
    try {
      await updateStock(editing.id_medicament, newQty);
      setMsg('Stock mis à jour ✓');
      setEditing(null);
      load();
    } catch {
      setMsg('Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium text-gray-900">Gestion des stocks</h1>
        {msg && <p className="text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">{msg}</p>}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher un médicament…"
          className="input flex-1 min-w-48"
        />
        <select value={filtre} onChange={e => setFiltre(e.target.value)} className="input w-40">
          <option value="">Tous statuts</option>
          <option value="disponible">Disponible</option>
          <option value="stock_bas">Stock bas</option>
          <option value="indisponible">Indisponible</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Chargement…</p>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Médicament</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Catégorie</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Qté</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => (
                <tr
                  key={s.id_stock}
                  className={s.statut === 'stock_bas' ? 'bg-amber-50/40' : s.statut === 'indisponible' ? 'bg-red-50/30' : ''}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{s.nom_commercial} {s.dosage}</p>
                    <p className="text-xs text-gray-400">{s.nom_generique}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">{s.categories}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.quantite}</td>
                  <td className="px-4 py-3"><Badge statut={s.statut} /></td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => { setEditing(s); setNewQty(s.quantite); setMsg(''); }}
                      className="btn-ghost text-xs px-3 py-1"
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Panneau de modification */}
      {editing && (
        <div className="mt-6 card border-l-4 border-l-green-400">
          <h2 className="font-medium text-gray-900 mb-4 text-sm">
            Modifier — {editing.nom_commercial} {editing.dosage}
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nouvelle quantité</label>
              <input
                type="number" min="0"
                value={newQty} onChange={e => setNewQty(parseInt(e.target.value) || 0)}
                className="input w-28"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Statut calculé</label>
              <Badge statut={newQty === 0 ? 'indisponible' : newQty < 10 ? 'stock_bas' : 'disponible'} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-60">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button onClick={() => setEditing(null)} className="btn-ghost text-sm">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
};

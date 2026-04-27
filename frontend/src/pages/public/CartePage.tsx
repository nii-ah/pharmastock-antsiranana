import { useState, useEffect }          from 'react';
import { MapContainer, TileLayer,
         Marker, Popup, useMap }        from 'react-leaflet';
import L                               from 'leaflet';
import { getPharmacies }               from '../../api';
import { Pharmacie }                   from '../../types';

// Icône personnalisée verte
const makeIcon = (color: string) => L.divIcon({
  className: '',
  html: `<div style="width:22px;height:22px;border-radius:50%;background:#fff;
         border:2.5px solid ${color};display:flex;align-items:center;
         justify-content:center;">
         <div style="width:8px;height:8px;border-radius:50%;background:${color};"></div>
         </div>`,
  iconSize:   [22, 22],
  iconAnchor: [11, 11],
});

const icons = {
  default: makeIcon('#3B6D11'),
};

const FitBounds = ({ pharmacies }: { pharmacies: Pharmacie[] }) => {
  const map = useMap();
  useEffect(() => {
    if (!pharmacies.length) return;
    const bounds = pharmacies
      .filter(p => p.latitude && p.longitude)
      .map(p => [p.latitude, p.longitude] as [number, number]);
    if (bounds.length) map.fitBounds(bounds, { padding: [40, 40] });
  }, [pharmacies, map]);
  return null;
};

export const CartePage = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacie[]>([]);
  const [district,   setDistrict]   = useState('');
  const [selected,   setSelected]   = useState<Pharmacie | null>(null);

  useEffect(() => {
    getPharmacies(district || undefined)
      .then(r => setPharmacies(r.data.data))
      .catch(() => {});
  }, [district]);

  return (
    <div className="flex h-[calc(100vh-56px)]">

      {/* Panneau latéral */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900 mb-3 text-sm">Pharmacies</h2>
          <select
            value={district} onChange={e => setDistrict(e.target.value)}
            className="input text-sm"
          >
            <option value="">Tous les districts</option>
            <option value="centre">Centre</option>
            <option value="port">Port</option>
            <option value="periph">Périphérie</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {pharmacies.map(p => (
            <div
              key={p.id_pharmacie}
              onClick={() => setSelected(p)}
              className={`p-3 border-b border-gray-100 cursor-pointer transition-colors text-sm ${
                selected?.id_pharmacie === p.id_pharmacie
                  ? 'bg-green-50 border-l-2 border-l-green-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              <p className="font-medium text-gray-900 truncate">{p.nom}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{p.adresse}</p>
              <p className="text-xs text-gray-400">
                {p.heure_ouverture?.slice(0,5)} – {p.heure_fermeture?.slice(0,5)}
              </p>
            </div>
          ))}
        </div>
      </aside>

      {/* Carte */}
      <div className="flex-1 relative">
        <MapContainer
          center={[-12.3484, 49.2977]}
          zoom={14}
          className="w-full h-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds pharmacies={pharmacies} />
          {pharmacies
            .filter(p => p.latitude && p.longitude)
            .map(p => (
              <Marker
                key={p.id_pharmacie}
                position={[p.latitude, p.longitude]}
                icon={icons.default}
                eventHandlers={{ click: () => setSelected(p) }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-medium">{p.nom}</p>
                    <p className="text-gray-500 text-xs">{p.adresse}</p>
                    {p.telephone && <p className="text-xs mt-1">📞 {p.telephone}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>

        {/* Fiche pharmacie sélectionnée */}
        {selected && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-72 card shadow-lg z-10">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-900">{selected.nom}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-gray-600 ml-2">✕</button>
            </div>
            <p className="text-xs text-gray-400 mb-3">{selected.adresse}</p>
            <div className="flex gap-2">
              <a
                href={`https://www.openstreetmap.org/directions?to=${selected.latitude},${selected.longitude}`}
                target="_blank" rel="noreferrer"
                className="btn-primary text-xs px-3 py-1.5 flex-1 text-center"
              >
                Itinéraire
              </a>
              {selected.telephone && (
                <a href={`tel:${selected.telephone}`} className="btn-ghost text-xs px-3 py-1.5 flex-1 text-center">
                  Appeler
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/dashboard',        label: 'Tableau de bord', icon: '⊞' },
  { to: '/dashboard/stocks', label: 'Gestion stocks',  icon: '📦' },
  { to: '/dashboard/gardes', label: 'Gardes',          icon: '📅' },
  { to: '/dashboard/stats',  label: 'Statistiques',    icon: '📊' },
];

export const Sidebar = () => {
  const { pharmacien, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-48 bg-white border-r border-gray-200 flex flex-col min-h-screen flex-shrink-0">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-gray-200">
        <div className="w-6 h-6 bg-green-600 rounded-md flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 1a1 1 0 011 1v4h4a1 1 0 010 2H9v4a1 1 0 01-2 0V8H3a1 1 0 010-2h4V2a1 1 0 011-1z"/>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-900 truncate">PharmaStock</span>
      </div>

      {/* Pharmacien info */}
      {pharmacien && (
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-400 mb-0.5">Connecté en tant que</p>
          <p className="text-xs font-medium text-gray-900 truncate">{pharmacien.pharmacie_nom}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3">
        <p className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wider">Navigation</p>
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to} to={to} end={to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-green-50 text-green-800 font-medium border-r-2 border-green-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full btn-ghost text-sm py-1.5"
        >
          Se déconnecter
        </button>
      </div>
    </aside>
  );
};

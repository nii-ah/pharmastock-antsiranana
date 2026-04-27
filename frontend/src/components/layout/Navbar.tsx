import { Link, NavLink } from 'react-router-dom';

export const Navbar = () => (
  <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
    <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 1a1 1 0 011 1v4h4a1 1 0 010 2H9v4a1 1 0 01-2 0V8H3a1 1 0 010-2h4V2a1 1 0 011-1z"/>
          </svg>
        </div>
        <span className="font-medium text-gray-900">PharmaStock</span>
        <span className="text-xs text-gray-400 hidden sm:inline">Antsiranana</span>
      </Link>

      {/* Liens */}
      <div className="flex items-center gap-1">
        {[
          { to: '/',       label: 'Accueil' },
          { to: '/carte',  label: 'Carte'   },
          { to: '/gardes', label: 'Gardes'  },
        ].map(({ to, label }) => (
          <NavLink
            key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-green-50 text-green-800 font-medium'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
        <Link to="/login" className="ml-2 btn-primary text-sm px-3 py-1.5">
          Espace pharmacien
        </Link>
      </div>
    </div>
  </nav>
);

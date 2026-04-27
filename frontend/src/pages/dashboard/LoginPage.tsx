import { useState, FormEvent } from 'react';
import { useNavigate, Link }   from 'react-router-dom';
import { useAuth }             from '../../context/AuthContext';

export const LoginPage = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 1a1 1 0 011 1v4h4a1 1 0 010 2H9v4a1 1 0 01-2 0V8H3a1 1 0 010-2h4V2a1 1 0 011-1z"/>
            </svg>
          </div>
          <h1 className="text-lg font-medium text-gray-900">Espace Pharmacien</h1>
          <p className="text-sm text-gray-400 mt-1">PharmaStock Antsiranana</p>
        </div>

        {/* Formulaire */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Adresse email</label>
              <input
                type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="pharmacie@exemple.mg"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Mot de passe</label>
              <input
                type="password" required
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </div>

            {error && (
              <div className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="btn-primary w-full py-2.5 disabled:opacity-60"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            Pas encore inscrit ? Contactez l'administrateur.
          </p>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">
            ← Retour au site public
          </Link>
        </div>
      </div>
    </div>
  );
};

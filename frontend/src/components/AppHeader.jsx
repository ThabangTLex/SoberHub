import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from './AuthContext';

export default function AppHeader({ showBack = false, showLogout = true }) {
  const { setUser } = useAuth();
  const logout = async () => {
    try { await api('/auth', { method: 'POST', body: JSON.stringify({ action: 'logout' }) }); } finally {
      setUser(null);
    }
  };
  return (
    <header className="app-header">
      <Link className="brand" to="/dashboard"><span className="logo">SH</span>Sober Hub</Link>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {showBack && <Link className="back" to="/dashboard">← Dashboard</Link>}
        {showLogout && <button className="btn outline" onClick={logout}>Log out</button>}
      </div>
    </header>
  );
}

import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const { pathname } = useLocation();
  return (
    <header className="header">
      <Link className="brand" to="/"><span className="logo">SH</span>Sober Hub</Link>
      <nav>
        <Link to="/login">Log in</Link>
        <Link className={pathname === '/' ? 'active' : ''} to="/">Home</Link>
        <Link to="/dashboard">Platform</Link>
        <Link to="/about">About</Link>
        <Link to="/brandguide">Brand Guide</Link>
        <Link className="btn primary" to="/register">Join Sober Hub</Link>
      </nav>
      <Link className="btn primary" to="/dashboard">Explore Platform</Link>
    </header>
  );
}

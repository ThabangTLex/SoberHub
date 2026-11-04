import { NavLink } from 'react-router-dom';

export default function AppSidebar() {
  return (
    <aside className="side">
      <small>MAIN</small>
      <NavLink to="/dashboard">🏠 Dashboard</NavLink>
      <NavLink to="/profile">👤 My Profile</NavLink>
      <NavLink to="/checkin">💚 Daily Check-in</NavLink>
      <NavLink to="/community">👥 Community</NavLink>
      <small>SUPPORT &amp; GROWTH</small>
      <NavLink to="/skills">🎓 Skills Hub</NavLink>
      <NavLink to="/mentor">💬 Mentor Chat</NavLink>
      <NavLink to="/emergency">🆘 Emergency Support</NavLink>
      <NavLink to="/employment">💼 Employment</NavLink>
      <small>ACCOUNT</small>
      <NavLink to="/settings">⚙️ Settings</NavLink>
      <NavLink to="/brandguide">🎨 Brand Guide</NavLink>
    </aside>
  );
}

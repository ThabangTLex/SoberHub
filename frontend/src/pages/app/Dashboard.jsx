import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import AppSidebar from '../../components/AppSidebar';
import { api, fmtDate } from '../../api';
import { useToast } from '../../components/Toast';

export default function Dashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);

  useEffect(() => {
    api('/dashboard').then(setData).catch(e => toast(e.message, 'error'));
  }, []);

  const u = data?.user;
  const stats = data?.stats;

  return (
    <>
      <AppHeader />
      <div className="app-layout">
        <AppSidebar />
        <main className="main">
          <div className="welcome">
            <div>
              <span className="eyebrow">MEMBER DASHBOARD</span>
              <h1>{u ? `Welcome back, ${u.first_name} 👋` : 'Loading your dashboard…'}</h1>
              <p className="muted">Small steps every day can build a stronger future.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link className="btn outline" to="/payment">Membership Payment</Link>
              <Link className="btn primary" to="/checkin">Complete Check-in</Link>
            </div>
          </div>
          <div className="alert">
            💚
            <div><b>You are not alone.</b><p>Use your mentor, community and support tools whenever you need connection.</p></div>
            <Link to="/mentor">Talk to a mentor →</Link>
          </div>
          <div className="dash">
            <section className="dashcard">
              <h3>Recovery Journey</h3>
              <div className="circle"><div><b>72%</b><span>weekly activity</span></div></div>
              <p className="muted">Consistency: <b style={{ color: '#2e7d32' }}>Good progress</b></p>
            </section>
            <section className="dashcard">
              <h3>Today</h3>
              <div className="today">
                <div>💚<span><strong>Daily check-in</strong><small>Take a moment to reflect</small></span><Link to="/checkin">Do it</Link></div>
                <div>🎓<span><strong>Skills Hub</strong><small>Continue learning</small></span><Link to="/skills">Open</Link></div>
                <div>💬<span><strong>Mentor support</strong><small>Connect with Sober Buddy</small></span><Link to="/mentor">Chat</Link></div>
              </div>
            </section>
            <section className="dashcard">
              <h3>Membership</h3>
              <span className="pill">{u ? (u.membership_status === 'active' ? `${u.membership_plan} / month — Active` : 'Membership inactive') : '—'}</span>
              <p className="muted" style={{ marginTop: 15 }}>{u ? (u.membership_status === 'active' ? `Active until ${fmtDate(u.membership_expires_at)}` : 'Choose a membership to activate access.') : 'Loading...'}</p>
              <p className="muted" style={{ marginTop: 15 }}>✓ Wi-Fi &nbsp; ✓ Gaming &nbsp; ✓ Mini gym &nbsp; ✓ Peer support</p>
            </section>
          </div>
          <div className="quick">
            <span className="eyebrow">QUICK ACCESS</span>
            <h2>What do you need today?</h2>
            <div className="quickgrid" style={{ marginTop: 18 }}>
              <Link className="quickcard" to="/checkin"><span>💚</span><strong>Daily Check-in</strong><small>Record how you're doing.</small></Link>
              <Link className="quickcard" to="/community"><span>👥</span><strong>Community</strong><small>Positive connection.</small></Link>
              <Link className="quickcard" to="/skills"><span>🎓</span><strong>Skills Hub</strong><small>Learn practical skills.</small></Link>
              <Link className="quickcard" to="/employment"><span>💼</span><strong>Employment</strong><small>Explore opportunities.</small></Link>
              <Link className="quickcard" to="/mentor"><span>💬</span><strong>Mentor Chat</strong><small>Connect with support.</small></Link>
              <Link className="quickcard" to="/emergency"><span>🆘</span><strong>Emergency Support</strong><small>Request urgent help.</small></Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

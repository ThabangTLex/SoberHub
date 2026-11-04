import { useEffect, useState } from 'react';
import AppHeader from '../../components/AppHeader';
import AppSidebar from '../../components/AppSidebar';
import { api, fmtDate } from '../../api';
import { useToast } from '../../components/Toast';

export default function Payment() {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [joiningPaid, setJoiningPaid] = useState(false);
  const [joiningFee, setJoiningFee] = useState(100);
  const [dailyRate, setDailyRate] = useState(10);
  const [topupDays, setTopupDays] = useState(5);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const d = await api('/payments');
      setPayments(d.payments);
      setJoiningPaid(d.joiningPaid);
      if (d.joiningFee) setJoiningFee(d.joiningFee / 100);
      if (d.dailyRate) setDailyRate(d.dailyRate / 100);
    } catch (e) { toast(e.message, 'error'); }
  };

  useEffect(() => { load(); }, []);

  const payJoining = async () => {
    setBusy(true); setMsg('Processing...');
    try {
      const d = await api('/payments', { method: 'POST', body: JSON.stringify({ type: 'joining', method: 'demo' }) });
      setMsg(d.message); toast(d.message); load();
    } catch (e) { setMsg(e.message); toast(e.message, 'error'); }
    finally { setBusy(false); }
  };

  const payTopup = async () => {
    if (topupDays < 1) return toast('Enter at least 1 day.', 'error');
    const amount_cents = topupDays * dailyRate * 100;
    setBusy(true); setMsg('Processing...');
    try {
      const d = await api('/payments', { method: 'POST', body: JSON.stringify({ type: 'topup', method: 'demo', amount_cents }) });
      setMsg(d.message); toast(d.message); load();
    } catch (e) { setMsg(e.message); toast(e.message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <AppHeader showBack showLogout />
      <div className="app-layout">
        <AppSidebar />
        <main className="main">
          <span className="eyebrow">MEMBERSHIP CHECKOUT</span>
          <h1>Membership &amp; Payments</h1>

          {/* Step 1 — Joining fee */}
          <section className="dashcard" style={{ marginBottom: 24 }}>
            <h3>Step 1 — Joining Fee</h3>
            {joiningPaid ? (
              <p style={{ color: 'var(--g)', fontWeight: 600 }}>✓ Joining fee paid. You are a member.</p>
            ) : (
              <>
                <p className="muted" style={{ marginBottom: 16 }}>Pay the once-off joining fee of <b>R{joiningFee}</b> to activate your membership.</p>
                <button className="btn primary" onClick={payJoining} disabled={busy}>Pay R{joiningFee} Joining Fee</button>
              </>
            )}
          </section>

          {/* Step 2 — Daily top-up */}
          {joiningPaid && (
            <section className="dashcard" style={{ marginBottom: 24 }}>
              <h3>Step 2 — Top Up Daily Access</h3>
              <p className="muted" style={{ marginBottom: 16 }}>R{dailyRate} per day. Choose how many days to top up.</p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="btn outline" style={{ padding: '8px 14px' }} onClick={() => setTopupDays(d => Math.max(1, d - 1))}>−</button>
                  <span style={{ fontSize: 22, fontWeight: 700, minWidth: 40, textAlign: 'center' }}>{topupDays}</span>
                  <button className="btn outline" style={{ padding: '8px 14px' }} onClick={() => setTopupDays(d => d + 1)}>+</button>
                  <span className="muted">days = <b>R{topupDays * dailyRate}</b></span>
                </div>
                <button className="btn primary" onClick={payTopup} disabled={busy}>Pay R{topupDays * dailyRate}</button>
              </div>
            </section>
          )}

          {msg && <p className="form-msg" style={{ marginBottom: 16 }}>{msg}</p>}

          {/* Payment history */}
          <section className="dashcard">
            <h3>Payment history</h3>
            {payments.length ? payments.map(p => (
              <div key={p.id} className="post">
                <b>{p.plan === 'joining' ? 'Joining Fee' : `Top-up`}</b> — R{(p.amount_cents / 100).toFixed(2)} — <span className="badge">{p.status}</span><br />
                <small>{fmtDate(p.created_at)} • {p.provider_reference || ''}</small>
              </div>
            )) : <p className="muted">No payments yet.</p>}
          </section>
        </main>
      </div>
    </>
  );
}

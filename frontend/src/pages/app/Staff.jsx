import { useEffect, useState } from 'react';
import AppHeader from '../../components/AppHeader';
import { api, fmtDate } from '../../api';
import { useToast } from '../../components/Toast';

export default function Staff() {
  const toast = useToast();
  const [data, setData] = useState(null);

  const load = () => api('/staff').then(setData).catch(e => toast(e.message, 'error'));
  useEffect(() => { load(); }, []);

  const updateRequest = async (type, id, status) => {
    try { await api('/staff', { method: 'PATCH', body: JSON.stringify({ type, id, status }) }); toast('Request status updated.'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const updatePayment = async (id, status) => {
    try { await api('/staff', { method: 'PATCH', body: JSON.stringify({ type: 'payment', id, status }) }); toast('Payment status updated.'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <AppHeader showLogout />
      <main className="page">
        <span className="eyebrow">STAFF PORTAL</span>
        <h1>Operations dashboard</h1>
        <p className="page-intro">Authorised staff can view members and manage incoming mentor and emergency support requests and manual EFT payments.</p>
        <div className="grid three">
          <div className="stat-card"><b>{data?.members.length ?? '—'}</b><span>Registered accounts</span></div>
          <div className="stat-card"><b>{data?.mentors.length ?? '—'}</b><span>Mentor requests</span></div>
          <div className="stat-card"><b>{data?.emergencies.length ?? '—'}</b><span>Emergency requests</span></div>
        </div>
        <section className="dashcard" style={{ marginTop: 25 }}>
          <h3>Members</h3>
          <div className="table-wrap">
            {data ? (
              <table className="table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Membership</th></tr></thead>
                <tbody>{data.members.map(m => (
                  <tr key={m.id}><td>{m.first_name} {m.last_name}</td><td>{m.email}</td><td>{m.role}</td><td><span className="badge">{m.membership_status}</span></td></tr>
                ))}</tbody>
              </table>
            ) : 'Loading...'}
          </div>
        </section>
        <section className="dashcard" style={{ marginTop: 25 }}>
          <h3>Support requests</h3>
          {data ? [...(data.emergencies || []).map(x => (
            <div key={`e-${x.id}`} className="post">
              <b>Emergency • {x.status}</b>
              <p>{x.first_name} {x.last_name}: {x.message}</p>
              <small>{fmtDate(x.created_at)}</small>
              <div className="request-actions">
                <button className="btn smallbtn" onClick={() => updateRequest('emergency', x.id, 'Resolved')}>Mark resolved</button>
              </div>
            </div>
          )), ...(data.mentors || []).map(x => (
            <div key={`m-${x.id}`} className="post">
              <b>Mentor • {x.status}</b>
              <p>{x.first_name} {x.last_name}: {x.message || 'Support requested'}</p>
              <small>{fmtDate(x.created_at)}</small>
              <div className="request-actions">
                <button className="btn smallbtn" onClick={() => updateRequest('mentor', x.id, 'In Progress')}>In progress</button>
                <button className="btn smallbtn outline" onClick={() => updateRequest('mentor', x.id, 'Resolved')}>Resolved</button>
              </div>
            </div>
          ))] : 'Loading...'}
        </section>
        <section className="dashcard" style={{ marginTop: 25 }}>
          <h3>Pending payments</h3>
          {data ? (data.payments || []).length ? (data.payments || []).map(p => (
            <div key={p.id} className="post">
              <b>{p.plan} — R{(Number(p.amount_cents) / 100).toFixed(2)} — {p.provider}</b>
              <p>{p.first_name} {p.last_name} ({p.email})</p>
              <small>{fmtDate(p.created_at)} • {p.provider_reference || 'Awaiting provider reference'}</small>
              {p.provider === 'manual_eft' && (
                <div className="request-actions">
                  <button className="btn smallbtn" onClick={() => updatePayment(p.id, 'paid')}>Confirm transfer</button>
                  <button className="btn smallbtn outline" onClick={() => updatePayment(p.id, 'rejected')}>Reject transfer</button>
                </div>
              )}
            </div>
          )) : <p className="muted">No pending payments.</p> : 'Loading...'}
        </section>
      </main>
    </>
  );
}

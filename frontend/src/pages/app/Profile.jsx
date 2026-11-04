import { useEffect, useState } from 'react';
import AppHeader from '../../components/AppHeader';
import AppSidebar from '../../components/AppSidebar';
import { api, fmtDate } from '../../api';
import { useToast } from '../../components/Toast';

export default function Profile() {
  const toast = useToast();
  const [u, setU] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/profile').then(d => {
      setU(d.user);
      setForm({ firstName: d.user.first_name, lastName: d.user.last_name, phone: d.user.phone || '' });
    }).catch(e => toast(e.message, 'error'));
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setBusy(true);
    try {
      await api('/profile', { method: 'PUT', body: JSON.stringify(form) });
      toast('Profile updated successfully.');
    } catch (e) { toast(e.message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <AppHeader showBack />
      <div className="app-layout">
        <AppSidebar />
        <main className="main">
          <span className="eyebrow">MY PROFILE</span>
          <h1>Profile</h1>
          <div className="form" style={{ maxWidth: 600 }}>
            <div className="formgrid">
              <label>First name<input value={form.firstName} onChange={set('firstName')} /></label>
              <label>Last name<input value={form.lastName} onChange={set('lastName')} /></label>
            </div>
            <label>Email address<input value={u?.email || ''} disabled /></label>
            <label>Phone number<input value={form.phone} onChange={set('phone')} /></label>
            <label>Membership<input value={u ? (u.membership_status === 'active' ? `${u.membership_plan} — Active until ${fmtDate(u.membership_expires_at)}` : 'Inactive') : '—'} disabled /></label>
            <button className="btn primary" onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button>
          </div>
        </main>
      </div>
    </>
  );
}

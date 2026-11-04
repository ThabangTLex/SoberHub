import { useState } from 'react';
import AppHeader from '../../components/AppHeader';
import AppSidebar from '../../components/AppSidebar';
import { api } from '../../api';
import { useToast } from '../../components/Toast';

export default function Settings() {
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (form.newPassword.length < 8) return setMsg('New password must be at least 8 characters.');
    if (form.newPassword !== form.confirmNewPassword) return setMsg('New passwords do not match.');
    setBusy(true); setMsg('Updating password...');
    try {
      await api('/auth', { method: 'POST', body: JSON.stringify({ action: 'change-password', currentPassword: form.currentPassword, newPassword: form.newPassword }) });
      setForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setMsg('Password changed successfully.');
      toast('Password updated.');
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <AppHeader showBack />
      <div className="app-layout">
        <AppSidebar />
        <main className="main">
          <span className="eyebrow">ACCOUNT</span>
          <h1>Settings</h1>
          <form className="form" style={{ maxWidth: 480 }} onSubmit={submit}>
            <label>Current password<input type="password" required value={form.currentPassword} onChange={set('currentPassword')} /></label>
            <label>New password<input type="password" minLength={8} required value={form.newPassword} onChange={set('newPassword')} /></label>
            <label>Confirm new password<input type="password" minLength={8} required value={form.confirmNewPassword} onChange={set('confirmNewPassword')} /></label>
            <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Updating...' : 'Change password'}</button>
            <p className="form-msg">{msg}</p>
          </form>
        </main>
      </div>
    </>
  );
}

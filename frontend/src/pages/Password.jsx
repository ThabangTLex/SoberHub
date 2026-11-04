import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const submit = async e => {
    e.preventDefault(); setMsg('Sending...');
    try { const d = await api('/auth', { method: 'POST', body: JSON.stringify({ action: 'forgot-password', email }) }); setMsg(d.message); }
    catch (err) { setMsg(err.message); }
  };
  return (
    <>
      <header className="header"><Link className="brand" to="/"><span className="logo">SH</span>Sober Hub</Link></header>
      <main className="auth-page">
        <section className="auth-card">
          <span className="eyebrow">PASSWORD RECOVERY</span>
          <h1>Forgot password</h1>
          <p className="muted">Enter your email and we will send a reset link.</p>
          <form className="form" onSubmit={submit}>
            <label>Email address<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
            <button className="btn primary" type="submit">Send reset link</button>
            <p className="form-msg">{msg}</p>
          </form>
          <p className="small"><Link className="text-link" to="/login">Back to login</Link></p>
        </section>
      </main>
    </>
  );
}

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const token = new URLSearchParams(window.location.search).get('token');
  const submit = async e => {
    e.preventDefault();
    if (!token) return setMsg('This reset link is missing.');
    if (password !== confirm) return setMsg('Passwords do not match.');
    if (password.length < 8) return setMsg('Password must be at least 8 characters.');
    setMsg('Resetting password...');
    try {
      const d = await api('/auth', { method: 'POST', body: JSON.stringify({ action: 'reset-password', token, newPassword: password }) });
      setMsg(d.message);
      setTimeout(() => window.location.href = '/login', 1200);
    } catch (err) { setMsg(err.message); }
  };
  return (
    <>
      <header className="header"><Link className="brand" to="/"><span className="logo">SH</span>Sober Hub</Link></header>
      <main className="auth-page">
        <section className="auth-card">
          <span className="eyebrow">PASSWORD RECOVERY</span>
          <h1>Reset password</h1>
          <form className="form" onSubmit={submit}>
            <label>New password<input type="password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" /></label>
            <label>Confirm new password<input type="password" minLength={8} required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm password" /></label>
            <button className="btn primary" type="submit">Reset password</button>
            <p className="form-msg">{msg}</p>
          </form>
        </section>
      </main>
    </>
  );
}

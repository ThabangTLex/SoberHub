import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../components/AuthContext';

export default function Login() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');
  const [resendMsg, setResendMsg] = useState('');

  const submit = async e => {
    e.preventDefault();
    setMsg('Signing in...');
    try {
      const d = await api('/auth', { method: 'POST', body: JSON.stringify({ action: 'login', email, password }) });
      setUser(d.user);
      navigate(['staff', 'admin'].includes(d.user.role) ? '/staff' : '/dashboard');
    } catch (err) {
      setMsg(err.message);
    }
  };

  const resend = async () => {
    if (!email) { setResendMsg('Enter your email address first.'); return; }
    try {
      const d = await api('/auth', { method: 'POST', body: JSON.stringify({ action: 'resend-verification', email }) });
      setResendMsg(d.message);
    } catch (e) { setResendMsg(e.message); }
  };

  return (
    <>
      <header className="header">
        <Link className="brand" to="/"><span className="logo">SH</span>Sober Hub</Link>
        <Link className="btn outline" to="/register">Create account</Link>
      </header>
      <main className="auth-page">
        <section className="auth-card">
          <span className="eyebrow">MEMBER &amp; STAFF ACCESS</span>
          <h1>Welcome back</h1>
          <p className="muted">Log in to access your Sober Hub account.</p>
          <form className="form" onSubmit={submit}>
            <label>Email address<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
            <div className="password-row">
              <label>Password<input type={show ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" /></label>
              <button type="button" className="btn outline password-toggle" onClick={() => setShow(s => !s)}>{show ? 'Hide' : 'Show'}</button>
            </div>
            <button className="btn primary" type="submit">Log In</button>
            <p className="form-msg">{msg}</p>
          </form>
          <div className="auth-links">
            <Link className="text-link" to="/forgot-password">Forgot your password?</Link>
            <button type="button" className="link-button" onClick={resend}>Resend verification email</button>
            {resendMsg && <p className="form-msg">{resendMsg}</p>}
          </div>
          <p className="small">New to Sober Hub? <Link className="text-link" to="/register">Create an account</Link></p>
        </section>
      </main>
    </>
  );
}

import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { sendVerificationCode } from '../emailjs';
import { useAuth } from '../components/AuthContext';

export default function Verify() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const submit = async e => {
    e.preventDefault();
    setMsg('Verifying...');
    try {
      const d = await api('/auth', { method: 'POST', body: JSON.stringify({ action: 'verify-code', email, code }) });
      setMsg(d.message);
      if (d.user) { setUser(d.user); setTimeout(() => navigate('/dashboard'), 1200); }
    } catch (err) { setMsg(err.message); }
  };

  const resend = async () => {
    if (!email) { setResendMsg('Enter your email address first.'); return; }
    try {
      const d = await api('/auth', { method: 'POST', body: JSON.stringify({ action: 'resend-verification', email }) });
      await sendVerificationCode({ toEmail: d.email, toName: d.firstName || 'there', code: d.code });
      setResendMsg('A new verification code has been sent to your email.');
      setResendCooldown(60);
    } catch (e) { setResendMsg(e.message); }
  };

  return (
    <>
      <header className="header">
        <Link className="brand" to="/"><span className="logo">SH</span>Sober Hub</Link>
      </header>
      <main className="auth-page">
        <section className="auth-card verify-card">
          <span className="eyebrow">EMAIL VERIFICATION</span>
          <h1>Verify your email</h1>
          <p className="muted">Enter the 6-digit code we sent to your email address.</p>
          <form className="form" onSubmit={submit}>
            <label>Email address<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
            <label>Verification code<input type="text" inputMode="numeric" maxLength={6} required value={code} onChange={e => setCode(e.target.value)} placeholder="123456" /></label>
            <button className="btn primary" type="submit">Verify email</button>
            <p className="form-msg">{msg}</p>
          </form>
          <div style={{ marginTop: 16 }}>
            <button type="button" className="btn outline" onClick={resend} disabled={resendCooldown > 0}>
              {resendCooldown > 0 ? `Resend again in ${resendCooldown}s` : 'Resend code'}
            </button>
            {resendMsg && <p className="form-msg" style={{ marginTop: 8 }}>{resendMsg}</p>}
          </div>
          <Link className="btn" to="/login" style={{ marginTop: 16, display: 'inline-block' }}>Back to login</Link>
        </section>
      </main>
    </>
  );
}

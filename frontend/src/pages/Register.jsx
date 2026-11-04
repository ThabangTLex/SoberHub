import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { sendVerificationCode } from '../emailjs';
import { useAuth } from '../components/AuthContext';

function strength(p) {
  if (!p) return { score: 0, label: '' };
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return { score: s, label: s <= 2 ? 'Weak' : s === 3 ? 'Fair' : s === 4 ? 'Good' : 'Strong' };
}

export default function Register() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('member');
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', confirmEmail: '', password: '', confirmPassword: '', staffCode: '', terms: false });
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const pw = strength(form.password);

  const submit = async e => {
    e.preventDefault();
    const parts = form.fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = parts.shift() || '';
    const lastName = parts.join(' ') || firstName;
    if (!firstName || !form.fullName.includes(' ')) return setMsg('Please enter your full name (first and last name).');
    if (form.email !== form.confirmEmail) return setMsg('Email addresses do not match.');
    if (form.password !== form.confirmPassword) return setMsg('Passwords do not match.');
    if (form.password.length < 8) return setMsg('Please use a password of at least 8 characters.');
    if (!form.terms) return setMsg('Please agree to the Terms of Service and Privacy Policy.');
    if (role === 'staff' && !form.staffCode.trim()) return setMsg('Please enter the staff registration code.');
    setBusy(true); setMsg('Creating account...');
    try {
      const d = await api('/auth', { method: 'POST', body: JSON.stringify({ action: 'register', firstName, lastName, email: form.email, phone: form.phone, password: form.password, role, staffCode: form.staffCode }) });
      if (d.requiresVerification) {
        await sendVerificationCode({ toEmail: d.email, toName: firstName, code: d.code });
        navigate(`/verify?email=${encodeURIComponent(d.email)}`);
        return;
      }
      // demo mode — logged in directly
      if (d.user) { setUser(d.user); navigate(d.user.role === 'staff' ? '/staff' : '/dashboard'); return; }
      setMsg(d.message || 'Account created. Check your email to verify it.');
    } catch (err) { setMsg(err.message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <header className="header">
        <Link className="brand" to="/"><span className="logo">SH</span>Sober Hub</Link>
        <Link className="btn outline" to="/login">Log in</Link>
      </header>
      <main className="auth-page">
        <section className="auth-card signup-card">
          <span className="eyebrow">CREATE YOUR ACCOUNT</span>
          <h1>Sign up</h1>
          <p className="muted">Join Sober Hub and access support, skills and community.</p>
          <div className="role-tabs">
            <button type="button" className={`role-tab${role === 'member' ? ' active' : ''}`} onClick={() => setRole('member')}>Member</button>
            <button type="button" className={`role-tab${role === 'staff' ? ' active' : ''}`} onClick={() => setRole('staff')}>Staff</button>
          </div>
          <form className="form" onSubmit={submit} noValidate>
            <div className="formgrid">
              <label>Full name<input required value={form.fullName} onChange={set('fullName')} placeholder="e.g. Aphiwe Sithole" /></label>
              <label>Phone number<input type="tel" value={form.phone} onChange={set('phone')} placeholder="e.g. 071 234 5678" /></label>
              <label>Email address<input type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" /></label>
              <label>Confirm email<input type="email" required value={form.confirmEmail} onChange={set('confirmEmail')} placeholder="Re-enter your email" /></label>
            </div>
            {role === 'staff' && (
              <div className="staff-panel">
                <b>Staff registration</b>
                <p className="muted">Staff accounts require an authorised registration code.</p>
                <label>Staff registration code<input value={form.staffCode} onChange={set('staffCode')} placeholder="Enter staff code" /></label>
              </div>
            )}
            <div className="password-row">
              <label>Password<input type={showPw ? 'text' : 'password'} minLength={8} required value={form.password} onChange={set('password')} placeholder="At least 8 characters" /></label>
              <button type="button" className="btn outline password-toggle" onClick={() => setShowPw(s => !s)}>{showPw ? 'Hide' : 'Show'}</button>
            </div>
            <div className="strength"><div style={{ width: `${pw.score * 20}%` }} /></div>
            {pw.label && <small className="muted">Password strength: {pw.label}</small>}
            <div className="password-row">
              <label>Confirm password<input type={showCpw ? 'text' : 'password'} minLength={8} required value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Confirm password" /></label>
              <button type="button" className="btn outline password-toggle" onClick={() => setShowCpw(s => !s)}>{showCpw ? 'Hide' : 'Show'}</button>
            </div>
            <label className="checkline"><input type="checkbox" checked={form.terms} onChange={set('terms')} /><span>I agree to the <a href="#" className="text-link">Terms of Service</a> and <a href="#" className="text-link">Privacy Policy</a>.</span></label>
            <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Creating account...' : 'Create Account'}</button>
            <p className="form-msg">{msg}</p>
          </form>
          <p className="small">Already have an account? <Link className="text-link" to="/login">Log in</Link></p>
        </section>
      </main>
    </>
  );
}

import { useState } from 'react';
import AppHeader from '../../components/AppHeader';
import AppSidebar from '../../components/AppSidebar';
import { api } from '../../api';
import { useToast } from '../../components/Toast';

export default function Emergency() {
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const panic = async () => {
    if (!window.confirm('Send an urgent support request to Sober Hub staff?')) return;
    setBusy(true);
    try {
      await api('/emergency', { method: 'POST', body: JSON.stringify({ message: message || 'Urgent support requested.' }) });
      setSent(true);
      toast('Support request recorded. If there is immediate danger, contact local emergency services.');
    } catch (e) { toast(e.message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <AppHeader showBack />
      <div className="app-layout">
        <AppSidebar />
        <main className="main">
          <span className="eyebrow">EMERGENCY SUPPORT</span>
          <h1>Emergency Support</h1>
          <div className="panic">
            <p className="muted">If you are in immediate danger, call emergency services. Use this button to alert the Sober Hub support team.</p>
            <label style={{ display: 'grid', gap: 8, marginBottom: 20, textAlign: 'left', maxWidth: 500, margin: '0 auto 20px' }}>
              Message (optional)
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Describe what you need..." />
            </label>
            <button className="panic" style={{ width: 190, height: 190, borderRadius: '50%', border: '10px solid #F8D7D7', background: '#D32F2F', color: '#fff', fontWeight: 700, cursor: 'pointer' }} onClick={panic} disabled={busy || sent}>
              {sent ? 'SUPPORT REQUEST RECORDED' : busy ? 'SENDING...' : 'PANIC BUTTON'}
            </button>
          </div>
        </main>
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import AppHeader from '../../components/AppHeader';
import AppSidebar from '../../components/AppSidebar';
import { api, fmtDate } from '../../api';
import { useToast } from '../../components/Toast';

export default function Mentor() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api('/mentor').then(d => setRequests(d.requests || [])).catch(e => toast(e.message, 'error'));
  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!message.trim()) return toast('Write a message first.', 'error');
    setBusy(true);
    try {
      await api('/mentor', { method: 'POST', body: JSON.stringify({ message }) });
      setMessage(''); toast('Your message was sent to the support team.'); load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <AppHeader showBack />
      <div className="app-layout">
        <AppSidebar />
        <main className="main">
          <span className="eyebrow">MENTOR CHAT</span>
          <h1>Mentor Chat</h1>
          <div className="chat">
            {requests.length ? requests.map(r => (
              <div key={r.id}>
                <div className="bubble user">{r.message || 'Support requested'}</div>
                <div className="bubble">Request status: {r.status}. The support team will follow up.</div>
              </div>
            )) : <div className="bubble">Share what kind of support you need. Your message will be sent to the Sober Hub support team.</div>}
          </div>
          <div className="compose" style={{ marginTop: 10 }}>
            <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type your message..." />
            <button className="btn primary" onClick={send} disabled={busy}>{busy ? 'Sending...' : 'Send'}</button>
          </div>
          <h2 style={{ margin: '30px 0 12px' }}>Request history</h2>
          {requests.length ? requests.map(r => (
            <div key={r.id} className="post">
              <b>{r.status}</b> — {r.message || 'Support requested'}<br />
              <small>{fmtDate(r.created_at)}</small>
            </div>
          )) : <p className="muted">No mentor requests yet.</p>}
        </main>
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import AppHeader from '../../components/AppHeader';
import AppSidebar from '../../components/AppSidebar';
import { api, fmtDate, escapeHtml } from '../../api';
import { useToast } from '../../components/Toast';

export default function Community() {
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api('/community').then(d => setPosts(d.posts)).catch(e => toast(e.message, 'error'));
  useEffect(() => { load(); }, []);

  const share = async () => {
    if (!content.trim()) return toast('Write a message first.', 'error');
    setBusy(true);
    try {
      await api('/community', { method: 'POST', body: JSON.stringify({ content }) });
      setContent(''); toast('Post shared.'); load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <AppHeader showBack />
      <div className="app-layout">
        <AppSidebar />
        <main className="main">
          <span className="eyebrow">COMMUNITY</span>
          <h1>Community</h1>
          <div className="form" style={{ marginBottom: 24 }}>
            <label>Share something positive<textarea value={content} onChange={e => setContent(e.target.value)} rows={3} placeholder="Write a message..." /></label>
            <button className="btn primary" onClick={share} disabled={busy}>{busy ? 'Sharing...' : 'Share post'}</button>
          </div>
          <div>
            {posts.length ? posts.map(p => (
              <article key={p.id} className="post">
                <b>{p.first_name} {p.last_name || ''}</b><small> • {fmtDate(p.created_at)}</small>
                <p>{p.content}</p>
              </article>
            )) : <p className="muted">No community posts yet.</p>}
          </div>
        </main>
      </div>
    </>
  );
}

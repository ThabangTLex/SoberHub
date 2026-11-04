import { useEffect, useState } from 'react';
import AppHeader from '../../components/AppHeader';
import AppSidebar from '../../components/AppSidebar';
import { api, fmtDate } from '../../api';
import { useToast } from '../../components/Toast';

const MOODS = ['😊 Great', '🙂 Good', '😐 Okay', '😔 Low', '😰 Struggling'];

export default function Checkin() {
  const toast = useToast();
  const [checkins, setCheckins] = useState([]);
  const [mood, setMood] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api('/checkins').then(d => setCheckins(d.checkins)).catch(e => toast(e.message, 'error'));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!mood) return toast('Please select how you are feeling.', 'error');
    setBusy(true);
    try {
      await api('/checkins', { method: 'POST', body: JSON.stringify({ mood, note }) });
      setNote(''); setMood('');
      toast('Daily check-in saved.');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <AppHeader showBack />
      <div className="app-layout">
        <AppSidebar />
        <main className="main">
          <span className="eyebrow">DAILY CHECK-IN</span>
          <h1>How are you feeling?</h1>
          <div className="form">
            <div className="moods">
              {MOODS.map(m => (
                <label key={m} className="mood">
                  <input type="radio" name="mood" value={m} checked={mood === m} onChange={() => setMood(m)} />
                  <span>{m.split(' ')[0]}</span>
                  <small>{m.split(' ').slice(1).join(' ')}</small>
                </label>
              ))}
            </div>
            <label>Note (optional)<textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="How was your day?" /></label>
            <button className="btn primary" onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save check-in'}</button>
          </div>
          <h2 style={{ margin: '30px 0 12px' }}>Recent check-ins</h2>
          <div id="recent">
            {checkins.length ? checkins.map(x => (
              <div key={x.id} className="post">
                <b>{x.mood}</b> — {x.note || 'No note added'}<br />
                <small>{fmtDate(x.created_at)}</small>
              </div>
            )) : <p className="muted">No check-ins yet.</p>}
          </div>
        </main>
      </div>
    </>
  );
}

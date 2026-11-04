import Header from '../components/Header';
import Footer from '../components/Footer';

export function About() {
  return (
    <>
      <Header />
      <main className="page">
        <span className="eyebrow">ABOUT US</span>
        <h1>About Sober Hub</h1>
        <p className="page-intro">Sober Hub is a youth-focused, substance-free support and productivity platform based in Katlehong.</p>
        <div className="two" style={{ marginTop: 40 }}>
          <div>
            <h2>Our Mission</h2>
            <p>We help young people in Katlehong who are recovering from substance abuse by providing a safe, affordable and connected environment that combines mentorship, productive activities, practical skills and opportunity.</p>
            <div className="checks" style={{ marginTop: 20 }}>
              <div>✓ Affordable for the Katlehong community</div>
              <div>✓ Holistic recovery + skills + opportunity</div>
              <div>✓ Familiar technology such as WhatsApp and gaming</div>
              <div>✓ Local and community-focused</div>
            </div>
          </div>
          <div className="quote">
            <b>"</b>
            <p>Recovery is more than simply stopping. It requires a safe space, community, purpose and opportunity.</p>
            <strong>Sober Hub Vision</strong>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export function Skills() {
  return (
    <>
      <Header />
      <main className="page">
        <span className="eyebrow">SKILLS HUB</span>
        <h1>Skills Hub</h1>
        <p className="page-intro">Vocational training designed to improve employability and create a productive future.</p>
        <div className="grid three" style={{ marginTop: 30 }}>
          <div className="card"><i>📱</i><h3>Cell Phone Repair</h3><p>Learn to diagnose and repair common smartphone issues.</p></div>
          <div className="card"><i>☕</i><h3>Barista Training</h3><p>Professional coffee preparation and customer service skills.</p></div>
          <div className="card"><i>💻</i><h3>Computer Skills</h3><p>Basic computer literacy, Microsoft Office and introductory programming.</p></div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export function Employment() {
  return (
    <>
      <Header />
      <main className="page">
        <span className="eyebrow">EMPLOYMENT</span>
        <h1>Employment Opportunities</h1>
        <p className="page-intro">Explore local job opportunities and internships connected to the Sober Hub network.</p>
        <div className="jobs" style={{ marginTop: 30 }}>
          <div className="job"><div className="jobicon">💼</div><div><b>Local Business Internships</b><p className="muted">Hands-on experience with Katlehong businesses partnered with Sober Hub.</p></div><a className="btn outline" href="#">Apply</a></div>
          <div className="job"><div className="jobicon">📱</div><div><b>Cell Phone Repair Technician</b><p className="muted">Entry-level positions available after completing the Skills Hub programme.</p></div><a className="btn outline" href="#">Apply</a></div>
          <div className="job"><div className="jobicon">☕</div><div><b>Barista / Café Assistant</b><p className="muted">Opportunities at local cafés for graduates of the barista training programme.</p></div><a className="btn outline" href="#">Apply</a></div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export function Brandguide() {
  const colors = [
    { name: 'Primary Green', hex: '#2E7D32' },
    { name: 'Dark Green', hex: '#1B5E20' },
    { name: 'Light Green', hex: '#81C784' },
    { name: 'Background', hex: '#F3F7F4' },
  ];
  return (
    <>
      <Header />
      <main className="page">
        <span className="eyebrow">BRAND GUIDE</span>
        <h1>Brand Guide</h1>
        <p className="page-intro">Sober Hub visual identity guidelines.</p>
        <h2 style={{ margin: '30px 0 16px' }}>Colours</h2>
        <div className="swatches">
          {colors.map(c => (
            <div key={c.hex} className="swatch">
              <div style={{ background: c.hex }} />
              <b>{c.name}</b>
              <code>{c.hex}</code>
            </div>
          ))}
        </div>
        <h2 style={{ margin: '30px 0 16px' }}>Logo</h2>
        <div className="hero-card" style={{ maxWidth: 300 }}>
          <div className="hero-logo">SH</div>
          <p className="muted" style={{ textAlign: 'center' }}>Sober Hub wordmark with icon</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

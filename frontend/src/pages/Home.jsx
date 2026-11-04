import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div>
            <span className="eyebrow">KATLEHONG SOBER-HUB &amp; SKILLS LAB</span>
            <h1>Support. Grow. <em>Thrive.</em></h1>
            <p className="lead">A safe, affordable and connected recovery support solution for young people—bringing mentorship, productive activities, practical skills and opportunity together.</p>
            <div className="actions">
              <Link className="btn primary" to="/dashboard">Explore Sober Hub</Link>
              <a className="btn outline" href="#services">View Services</a>
            </div>
            <p className="small"><b>Membership:</b> R50–R100 per month</p>
          </div>
          <div className="hero-card">
            <div className="hero-logo">SH</div>
            <h2>A local solution for a real community need</h2>
            <p>Sober Hub addresses boredom, peer pressure, unemployment and limited access to supportive spaces through a combined physical and digital model.</p>
            <div className="stats">
              <div><b>80%</b><span>found Sober Buddy useful</span></div>
              <div><b>65%</b><span>considered R50–R100 fair</span></div>
            </div>
          </div>
        </section>

        <section className="section" id="services">
          <div className="heading">
            <span className="eyebrow">OUR SOLUTION</span>
            <h2>One hub. Three connected pillars.</h2>
            <p>Sober Hub combines the physical Sober-Hub membership service, Sober-Buddy mobile support and Skills Lab vocational development.</p>
          </div>
          <div className="grid three">
            <article className="card"><i>🏠</i><h3>Sober-Hub Membership</h3><p>A safe environment where young people can spend free time productively.</p><ul><li>High-speed internet</li><li>Gaming stations such as FIFA</li><li>Small fitness centre / mini gym</li><li>Daily peer support groups</li></ul></article>
            <article className="card featured"><i>💬</i><h3>Sober-Buddy</h3><p>Mobile support through WhatsApp or a mobile app, connecting young people with recovery mentors.</p><ul><li>Round-the-clock mentor communication</li><li>Daily motivational audio messages</li><li>Panic button for urgent support</li><li>Escalation to support when needed</li></ul></article>
            <article className="card"><i>🎓</i><h3>Skills Lab</h3><p>Vocational training designed to improve employability and create a productive future.</p><ul><li>Cell phone repair</li><li>Barista training</li><li>Basic computer skills / programming</li><li>Potential local-business internships</li></ul></article>
          </div>
        </section>

        <section className="section soft">
          <div className="two">
            <div>
              <span className="eyebrow">WHY SOBER HUB?</span>
              <h2>Recovery is more than simply stopping.</h2>
              <p>Our project focuses on wider challenges that can make recovery difficult—boredom, negative peer pressure, unemployment and lack of safe spaces.</p>
              <div className="checks">
                <div>✓ Affordable for the Katlehong community</div>
                <div>✓ Holistic recovery + skills + opportunity</div>
                <div>✓ Familiar technology such as WhatsApp and gaming</div>
                <div>✓ Local and community-focused</div>
              </div>
            </div>
            <div className="quote">
              <b>"</b>
              <p>Our business helps young people in Katlehong who are recovering from substance abuse and struggling with relapse, negative peer pressure, lack of safe spaces and job opportunities.</p>
              <strong>Sober Hub Value Proposition</strong>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="heading"><span className="eyebrow">RESEARCH INSIGHT</span><h2>The idea is grounded in community feedback.</h2></div>
          <div className="grid four">
            <div className="stat-card"><b>90%</b><span>rated boredom as serious or very serious</span></div>
            <div className="stat-card"><b>75%</b><span>identified peer pressure as a major cause</span></div>
            <div className="stat-card"><b>55%</b><span>identified unemployment / hopelessness</span></div>
            <div className="stat-card"><b>80%</b><span>said WhatsApp Sober Buddy would be useful</span></div>
          </div>
        </section>

        <section className="cta">
          <div>
            <span className="eyebrow light">DIGITAL PLATFORM</span>
            <h2>See how Sober Hub works.</h2>
            <p>The prototype brings membership, daily check-ins, community, Skills Hub, mentor support, emergency support and employment support into one browser-based experience.</p>
          </div>
          <Link className="btn white" to="/dashboard">Open Platform</Link>
        </section>
      </main>
      <Footer />
    </>
  );
}

import { Link } from 'react-router-dom';
import { ArrowUpRight, ScanLine } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="marketing-page">
      <header className="marketing-nav">
        <Link to="/" className="marketing-brand"><span className="brand-mark"><ScanLine size={19} strokeWidth={2.2} /></span><span><strong>ShelfSight</strong><small>RETAIL INTELLIGENCE</small></span></Link>
        <nav className="marketing-actions" aria-label="Account">
          <Link to="/login" className="marketing-login">Log in</Link>
          <Link to="/register" className="button button-primary">Get started <ArrowUpRight size={15} /></Link>
        </nav>
      </header>
      <main>
        <section className="landing-hero">
          <img className="landing-photo" src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2200&q=85" alt="Fresh produce arranged for retail sale" />
          <div className="landing-scrim" />
          <div className="landing-content">
            <p className="landing-kicker">RETAIL EXECUTION / INTELLIGENCE</p>
            <h1>See the shelf.<br /><em>Know what to do.</em></h1>
            <p className="landing-description">Turn everyday shelf walks into clear, prioritized action for every store team.</p>
            <div className="landing-actions"><Link to="/register" className="button landing-primary">Create account <ArrowUpRight size={16} /></Link><Link to="/login" className="landing-secondary">Sign in to your workspace <span aria-hidden="true">→</span></Link></div>
          </div>
          <div className="landing-note"><span>FIELD NOTE 01</span><p>A clearer view from aisle to action.</p></div>
        </section>
        <section className="landing-ribbon" aria-label="Workflow overview"><span>Observe</span><i /><span>Prioritize</span><i /><span>Resolve</span><small>ONE CONTINUOUS STORE WORKFLOW</small></section>
      </main>
    </div>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="footer-wrapper">
      <div className="container">
        <div className="footer-grid">
          {/* Brand info */}
          <div className="footer-section">
            <div className="footer-logo">నవ తరంగాలు</div>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)' }}>
              నవ తరంగాలు తెలుగు ప్రజల విశ్వసనీయ సమాచార వేదిక. నిష్పక్షపాత, ఖచ్చితమైన వార్తలతో ప్రతిక్షణం ప్రజా పక్షాన నిలుస్తుంది.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <a href="#" className="share-btn fb" style={{ padding: '6px 12px', fontSize: '11px' }}>Facebook</a>
              <a href="#" className="share-btn tw" style={{ padding: '6px 12px', fontSize: '11px' }}>Twitter / X</a>
              <a href="#" className="share-btn wa" style={{ padding: '6px 12px', fontSize: '11px' }}>WhatsApp Channel</a>
            </div>
          </div>

          {/* Core Categories column */}
          <div className="footer-section">
            <h4 style={{ color: 'var(--accent-color)', fontSize: '16px', fontWeight: 'bold' }}>ముఖ్యమైన లింకులు</h4>
            <ul className="footer-links" style={{ fontSize: '14px' }}>
              <li><Link to="/search?category=andhra-pradesh">ఆంధ్రప్రదేశ్</Link></li>
              <li><Link to="/search?category=telangana">తెలంగాణ</Link></li>
              <li><Link to="/search?category=politics">రాజకీయాలు</Link></li>
              <li><Link to="/search?category=cinema">సినిమా</Link></li>
              <li><Link to="/search?category=sports">క్రీడలు</Link></li>
              <li><Link to="/epaper">ఇ-పేపర్ (E-Paper)</Link></li>
            </ul>
          </div>

          {/* Newsletter / Contact column */}
          <div className="footer-section">
            <h4 style={{ color: 'var(--accent-color)', fontSize: '16px', fontWeight: 'bold' }}>వార్తాలేఖ (Newsletter)</h4>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
              మా రోజువారీ తాజా సమాచారాన్ని నేరుగా మీ ఈమెయిల్ లో పొందండి.
            </p>
            {subscribed ? (
              <div style={{ backgroundColor: 'rgba(46, 204, 113, 0.2)', padding: '10px', borderRadius: '4px', fontSize: '13px', color: '#2ecc71' }}>
                ✓ వార్తాలేఖకు విజయవంతంగా చందాదారులయ్యారు!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input 
                  type="email" 
                  placeholder="మీ ఈమెయిల్ రాయండి..." 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  style={{ padding: '8px 12px', borderRadius: '4px', border: 'none', fontSize: '13px' }}
                />
                <button type="submit" className="btn btn-secondary" style={{ fontSize: '13px', padding: '6px', justifyContent: 'center' }}>
                  సబ్‌స్క్రయిబ్
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} నవ తరంగాలు (Nava Tharangalu) మీడియా గ్రూప్. ఆల్ రైట్స్ రిజర్వ్డ్.</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="#">గురించి (About Us)</a>
            <a href="#">సంప్రదించండి (Contact Us)</a>
            <a href="#">గోప్యతా విధానం (Privacy Policy)</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

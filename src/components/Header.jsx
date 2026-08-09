import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Header({ user, onLoginClick, onLogout }) {
  const [tickerItems, setTickerItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch breaking news ticker & categories
  useEffect(() => {
    fetch('/api/breaking')
      .then(res => res.json())
      .then(data => setTickerItems(data))
      .catch(err => console.error('Error fetching breaking news:', err));

    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        // Only main categories (parent === null)
        const mainCats = data.filter(c => !c.parent);
        setCategories(mainCats);
      })
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  // Sync theme selection to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Get current formatted dates
  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('te-IN', options);
    const engDateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    return `${dateStr} | ${engDateStr}`;
  };

  return (
    <header className="header-wrapper">
      {/* Top bar with dates, theme, and user identity */}
      <div className="top-bar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>{getFormattedDate()}</div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} title="రాత్రి / పగలు మోడ్">
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
            {user ? (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontWeight: '600' }}>{user.name} ({user.role})</span>
                <Link to="/admin" className="btn-epaper" style={{ padding: '2px 8px', fontSize: '12px' }}>CMS</Link>
                <button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary-color)', fontWeight: 'bold' }}>లాగౌట్</button>
              </div>
            ) : (
              <button onClick={onLoginClick} className="btn-login" style={{ padding: '2px 10px', fontSize: '12px' }}>ఎడిటర్ లాగిన్</button>
            )}
          </div>
        </div>
      </div>

      {/* Main logo and search area */}
      <div className="brand-section">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <Link to="/" className="logo-container">
            <svg className="logo-svg" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
              <path d="M10,45 C20,30 40,30 50,45 C60,60 80,60 90,45 L90,15 C80,30 60,30 50,15 C40,0 20,0 10,15 Z" fill="var(--secondary-color)" opacity="0.8"/>
              <path d="M30,40 C40,25 60,25 70,40 C80,55 100,55 110,40 L110,10 C100,25 80,25 70,10 C60,-5 40,-5 30,10 Z" fill="var(--primary-color)" opacity="0.9"/>
              <circle cx="50" cy="30" r="10" fill="var(--accent-color)" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="logo-text">నవ తరంగాలు</span>
              <span style={{ fontStyle: 'italic', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', fontWeight: 'bold' }}>NAVA THARANGALU</span>
            </div>
          </Link>

          <form onSubmit={handleSearchSubmit} className="search-box">
            <input 
              type="text" 
              placeholder="వార్తల కోసం శోధించండి..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit">🔍</button>
          </form>

          <div className="action-buttons">
            <Link to="/epaper" className="btn-epaper">ఇ-పేపర్ (E-Paper)</Link>
          </div>
        </div>
      </div>

      {/* Categories navbar */}
      <nav style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
        <div className="container">
          <ul className="nav-menu">
            <li>
              <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`} style={{ color: 'white' }}>హోమ్</Link>
            </li>
            {categories.map(cat => (
              <li key={cat.id}>
                <Link 
                  to={`/search?category=${cat.slug}`} 
                  className={`nav-item ${location.search.includes(`category=${cat.slug}`) ? 'active' : ''}`} 
                  style={{ color: 'white' }}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/gallery" className={`nav-item ${location.pathname === '/gallery' ? 'active' : ''}`} style={{ color: 'white' }}>ఫోటో గ్యాలరీ</Link>
            </li>
            <li>
              <Link to="/videos" className={`nav-item ${location.pathname === '/videos' ? 'active' : ''}`} style={{ color: 'white' }}>వీడియో వార్తలు</Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Breaking News Ticker */}
      {tickerItems.length > 0 && (
        <div className="ticker-container">
          <div className="ticker-label">తాజా వార్తలు (Breaking News)</div>
          <div className="ticker-marquee">
            {/* Repeat items twice to form a seamless loop */}
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <span key={index} className="ticker-item">
                <span className="ticker-bullet">★</span>
                {item.text}
              </span>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

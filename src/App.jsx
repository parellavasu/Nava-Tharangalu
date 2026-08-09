import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import Search from './pages/Search';
import EPaper from './pages/EPaper';
import Gallery from './pages/Gallery';
import Videos from './pages/Videos';
import AdminDashboard from './pages/AdminDashboard';

function AppContent({ user, setUser, onLoginClick, onLogout, isLoginModalOpen, setLoginModalOpen }) {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  // Login form inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'లాగిన్ విఫలమైంది');
      }
      const data = await res.json();
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setLoginModalOpen(false);
      setUsername('');
      setPassword('');
    } catch (err) {
      setLoginError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Hide portal header/footer on full-screen admin console */}
      {!isAdminPath && (
        <Header user={user} onLoginClick={onLoginClick} onLogout={onLogout} />
      )}

      <main style={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/articles/:slug" element={<ArticleDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/epaper" element={<EPaper />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/admin" element={<AdminDashboard user={user} />} />
        </Routes>
      </main>

      {!isAdminPath && <Footer />}

      {/* Login modal overlay */}
      {isLoginModalOpen && (
        <div className="modal-overlay" onClick={() => setLoginModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setLoginModalOpen(false)}>×</button>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--primary-color)' }}>
              ఎడిటోరియల్ టీమ్ లాగిన్ (CMS Login)
            </h3>
            
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label>యూజర్ పేరు (Username) *</label>
                <input 
                  type="text" required className="form-control"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin / editor / reporter"
                />
              </div>

              <div className="form-group">
                <label>పాస్‌వర్డ్ (Password) *</label>
                <input 
                  type="password" required className="form-control"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="పాస్‌వర్డ్ టైప్ చేయండి"
                />
              </div>

              {loginError && (
                <div style={{ color: 'var(--secondary-color)', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                  ✕ {loginError}
                </div>
              )}

              <div style={{ backgroundColor: 'var(--bg-light)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                💡 <b>డెమో ఖాతాలు:</b><br />
                • అడ్మిన్: <code>admin</code> / <code>admin123</code><br />
                • ఎడిటర్: <code>editor</code> / <code>editor123</code><br />
                • రిపోర్టర్: <code>reporter</code> / <code>reporter123</code>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                లాగిన్ అవ్వండి
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  // Auto authenticate token on reload
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Session expired');
          return res.json();
        })
        .then(data => setUser(data.user))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        });
    }
  }, []);

  const handleLogout = () => {
    const token = localStorage.getItem('token');
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(() => {
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/';
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/';
      });
  };

  return (
    <Router>
      <AppContent 
        user={user} 
        setUser={setUser} 
        onLoginClick={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        isLoginModalOpen={isLoginModalOpen}
        setLoginModalOpen={setLoginModalOpen}
      />
    </Router>
  );
}

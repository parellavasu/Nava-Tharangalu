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

  // Forgot password workflow states
  const [forgotStep, setForgotStep] = useState(0); // 0 = login, 1 = username input, 2 = question verify, 3 = reset password input, 4 = registration input
  const [forgotUsername, setForgotUsername] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Registration states
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regQuestion, setRegQuestion] = useState('మీ మొదటి పాఠశాల పేరు?');
  const [regAnswer, setRegAnswer] = useState('');
  const [regRole, setRegRole] = useState('Super Admin');
  const [regSuccess, setRegSuccess] = useState('');

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

  const handleForgotUsernameSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotUsername })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'యూజర్ కనుగొనబడలేదు');
      }
      const data = await res.json();
      setSecurityQuestion(data.question);
      setForgotStep(2);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleForgotAnswerSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    // Advance to Step 3. The API call /api/auth/reset-password will verify the answer.
    setForgotStep(3);
  };

  const handleForgotResetSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setForgotSuccess('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: forgotUsername,
          answer: forgotAnswer,
          newPassword: forgotNewPassword
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'పాస్‌వర్డ్ రీసెట్ విఫలమైంది');
      }
      setForgotSuccess('✓ పాస్‌వర్డ్ విజయవంతంగా రీసెట్ చేయబడింది! లాగిన్ అవ్వండి.');
      setTimeout(() => {
        setForgotStep(0);
        setForgotUsername('');
        setForgotAnswer('');
        setForgotNewPassword('');
        setForgotSuccess('');
      }, 2000);
    } catch (err) {
      setLoginError(err.message);
      // Go back to answer step if wrong
      setForgotStep(2);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setRegSuccess('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          username: regUsername,
          password: regPassword,
          role: regRole,
          securityQuestion: regQuestion,
          securityAnswer: regAnswer
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'రిజిస్ట్రేషన్ విఫలమైంది');
      }
      setRegSuccess('✓ అడ్మిన్ రిజిస్ట్రేషన్ విజయవంతమైంది! లాగిన్ అవ్వండి.');
      setTimeout(() => {
        setForgotStep(0);
        setRegName('');
        setRegUsername('');
        setRegPassword('');
        setRegQuestion('మీ మొదటి పాఠశాల పేరు?');
        setRegAnswer('');
        setRegRole('Super Admin');
        setRegSuccess('');
      }, 2000);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  // Reset modal state when closed
  useEffect(() => {
    if (!isLoginModalOpen) {
      setForgotStep(0);
      setForgotUsername('');
      setForgotAnswer('');
      setForgotNewPassword('');
      setLoginError('');
      setForgotSuccess('');
      setUsername('');
      setPassword('');
      setRegName('');
      setRegUsername('');
      setRegPassword('');
      setRegQuestion('మీ మొదటి పాఠశాల పేరు?');
      setRegAnswer('');
      setRegRole('Super Admin');
      setRegSuccess('');
    }
  }, [isLoginModalOpen]);

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
            
            {forgotStep === 0 && (
              <>
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
                      placeholder="లాగిన్ ఐడీ టైప్ చేయండి"
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span 
                      onClick={() => { setForgotStep(1); setLoginError(''); }} 
                      style={{ fontSize: '12.5px', color: 'var(--secondary-color)', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
                    >
                      పాస్‌వర్డ్ మర్చిపోయారా? (Forgot Password?)
                    </span>
                    <span 
                      onClick={() => { setForgotStep(4); setLoginError(''); }} 
                      style={{ fontSize: '12.5px', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
                    >
                      కొత్త ఖాతా సృష్టి (Register)
                    </span>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    లాగిన్ అవ్వండి
                  </button>
                </form>
              </>
            )}

            {forgotStep === 1 && (
              <>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--primary-color)' }}>
                  పాస్‌వర్డ్ రీసెట్ - యూజర్ ఐడీ
                </h3>
                
                <form onSubmit={handleForgotUsernameSubmit}>
                  <div className="form-group">
                    <label>మీ యూజర్ పేరు (Username) *</label>
                    <input 
                      type="text" required className="form-control"
                      value={forgotUsername}
                      onChange={e => setForgotUsername(e.target.value)}
                      placeholder="ఉదాహరణ: admin"
                    />
                  </div>

                  {loginError && (
                    <div style={{ color: 'var(--secondary-color)', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                      ✕ {loginError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button type="button" onClick={() => setForgotStep(0)} className="btn btn-muted" style={{ flex: 1, justifyContent: 'center' }}>రద్దు</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>కొనసాగించు</button>
                  </div>
                </form>
              </>
            )}

            {forgotStep === 2 && (
              <>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--primary-color)' }}>
                  పాస్‌వర్డ్ రీసెట్ - సెక్యూరిటీ ప్రశ్న
                </h3>
                
                <form onSubmit={handleForgotAnswerSubmit}>
                  <div style={{ backgroundColor: 'var(--bg-light)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '14px', marginBottom: '16px', fontWeight: '600' }}>
                    ప్రశ్న: {securityQuestion}
                  </div>

                  <div className="form-group">
                    <label>మీ సమాధానం (Security Answer) *</label>
                    <input 
                      type="text" required className="form-control"
                      value={forgotAnswer}
                      onChange={e => setForgotAnswer(e.target.value)}
                      placeholder="సмаధానం టైప్ చేయండి"
                    />
                  </div>

                  {loginError && (
                    <div style={{ color: 'var(--secondary-color)', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                      ✕ {loginError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button type="button" onClick={() => setForgotStep(1)} className="btn btn-muted" style={{ flex: 1, justifyContent: 'center' }}>వెనుకకు</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>వెరిఫై</button>
                  </div>
                </form>
              </>
            )}

            {forgotStep === 3 && (
              <>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--primary-color)' }}>
                  పాస్‌వర్డ్ రీసెట్ - కొత్త పాస్‌వర్డ్
                </h3>
                
                <form onSubmit={handleForgotResetSubmit}>
                  <div className="form-group">
                    <label>కొత్త పాస్‌వర్డ్ (New Password) *</label>
                    <input 
                      type="password" required className="form-control"
                      value={forgotNewPassword}
                      onChange={e => setForgotNewPassword(e.target.value)}
                      placeholder="కనీసం 6 అక్షరాలు"
                    />
                  </div>

                  {loginError && (
                    <div style={{ color: 'var(--secondary-color)', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                      ✕ {loginError}
                    </div>
                  )}

                  {forgotSuccess && (
                    <div style={{ color: 'var(--primary-color)', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                      {forgotSuccess}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button type="button" onClick={() => setForgotStep(2)} className="btn btn-muted" style={{ flex: 1, justifyContent: 'center' }}>వెనుకకు</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>రీసెట్ చేయండి</button>
                  </div>
                </form>
              </>
            )}

            {forgotStep === 4 && (
              <>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--primary-color)' }}>
                  కొత్త అడ్మిన్ రిజిస్ట్రేషన్ (Register Admin)
                </h3>
                
                <form onSubmit={handleRegisterSubmit}>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>పూర్తి పేరు (Real Name) *</label>
                    <input 
                      type="text" required className="form-control"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="పూర్తి పేరు రాయండి"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>యూజర్ పేరు (Username) *</label>
                    <input 
                      type="text" required className="form-control"
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                      placeholder="లాగిన్ ఐడీ (ఇంగ్లీష్‌ అక్షరాలు)"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>పాస్‌వర్డ్ (Password) *</label>
                    <input 
                      type="password" required className="form-control"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="పాస్‌వర్డ్ కనీసం 6 అక్షరాలు"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>పాత్ర అధికారం (System Role) *</label>
                    <select 
                      className="form-control" required
                      value={regRole}
                      onChange={e => setRegRole(e.target.value)}
                    >
                      <option value="Super Admin">Super Admin (పూర్తి అధికారాలు)</option>
                      <option value="Editor">Editor (వార్తల ప్రచురణ & వర్గాలు)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>సెక్యూరిటీ ప్రశ్న (Forgot Password Question) *</label>
                    <input 
                      type="text" required className="form-control"
                      value={regQuestion}
                      onChange={e => setRegQuestion(e.target.value)}
                      placeholder="పాస్‌వర్డ్ రీసెట్ చేయడానికి ప్రశ్న"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>సెక్యూరిటీ సమాధానం (Security Answer) *</label>
                    <input 
                      type="text" required className="form-control"
                      value={regAnswer}
                      onChange={e => setRegAnswer(e.target.value)}
                      placeholder="సమాధానం టైప్ చేయండి"
                    />
                  </div>

                  {loginError && (
                    <div style={{ color: 'var(--secondary-color)', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
                      ✕ {loginError}
                    </div>
                  )}

                  {regSuccess && (
                    <div style={{ color: 'var(--primary-color)', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
                      {regSuccess}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button type="button" onClick={() => setForgotStep(0)} className="btn btn-muted" style={{ flex: 1, justifyContent: 'center' }}>రద్దు</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>రిజిస్టర్</button>
                  </div>
                </form>
              </>
            )}

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
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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

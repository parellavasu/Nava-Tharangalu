import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Unified lists
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [breakingNews, setBreakingNews] = useState([]);
  const [epapers, setEpapers] = useState([]);
  const [ads, setAds] = useState([]);
  const [backups, setBackups] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Stats cards counters
  const [stats, setStats] = useState({ totalArticles: 0, totalViews: 0, activeBreaking: 0, totalAds: 0 });

  // Creation/Editing Modal Triggers & Form states
  const [modalType, setModalType] = useState(null); // 'article', 'category', 'breaking', 'epaper', 'ad', 'restore'
  const [editingId, setEditingId] = useState(null);
  
  // 1. Article Form
  const [articleForm, setArticleForm] = useState({
    title: '', content: '', description: '', slug: '', category: '', subcategory: '',
    tags: '', status: 'Draft', breakingStatus: false, featuredStatus: false, featuredImage: null,
    seoTitle: '', seoDescription: ''
  });

  // 2. Category Form
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', parent: '' });

  // 3. Breaking Form
  const [breakingForm, setBreakingForm] = useState({ text: '', priority: '1', active: true, expirationTime: '' });

  // 4. EPaper Form
  const [epaperForm, setEpaperForm] = useState({ date: new Date().toISOString().split('T')[0], title: '', pdfUrl: null });

  // 5. Ad Form
  const [adForm, setAdForm] = useState({ name: '', zone: 'header-ad', imageUrl: null, targetUrl: '', startDate: '', endDate: '', active: true });

  // 6. Backup Restore Form
  const [selectedBackupFile, setSelectedBackupFile] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');

  // Redirect to Home if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Load dashboard dataset
  const loadData = () => {
    if (!user) return;
    
    // Fetch categories first (needed for article inputs)
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error(err));

    // Fetch articles
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
    fetch('/api/articles/admin', { headers })
      .then(res => res.json())
      .then(data => {
        setArticles(data);
        const viewsCount = data.reduce((acc, curr) => acc + (curr.viewCount || 0), 0);
        setStats(prev => ({ ...prev, totalArticles: data.length, totalViews: viewsCount }));
      })
      .catch(err => console.error(err));

    // Fetch breaking news
    fetch('/api/breaking/admin', { headers })
      .then(res => res.json())
      .then(data => {
        setBreakingNews(data);
        const activeCount = data.filter(b => b.active).length;
        setStats(prev => ({ ...prev, activeBreaking: activeCount }));
      })
      .catch(err => console.error(err));

    // Fetch E-papers
    fetch('/api/epaper')
      .then(res => res.json())
      .then(data => setEpapers(data))
      .catch(err => console.error(err));

    // Fetch Ads
    fetch('/api/ads/admin', { headers })
      .then(res => res.json())
      .then(data => {
        setAds(data);
        setStats(prev => ({ ...prev, totalAds: data.length }));
      })
      .catch(err => console.error(err));

    // Fetch Backups & Logs if Super Admin
    if (user.role === 'Super Admin') {
      fetch('/api/backups', { headers })
        .then(res => res.json())
        .then(data => setBackups(data))
        .catch(err => console.error(err));

      fetch('/api/admin/logs', { headers })
        .then(res => res.json())
        .then(data => setAuditLogs(data))
        .catch(err => console.error(err));
    }
  };

  useEffect(() => {
    loadData();
  }, [user, activeTab]);

  // Generic File Upload handler
  const handleFileUpload = async (e, fieldSetter) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadProgress('ఫైల్ అప్‌లోడ్ అవుతోంది...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      fieldSetter(data.url);
      setUploadProgress('✓ ఫైల్ అప్‌లోడ్ పూర్తయింది.');
    } catch (err) {
      console.error(err);
      setUploadProgress('✕ అప్‌లోడ్ విఫలమైంది: ' + err.message);
    }
  };

  // ================= Form Actions =================

  // Article Action: Create/Update
  const handleArticleSubmit = async (e) => {
    e.preventDefault();
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
    
    // Split comma separated tags
    const tagArray = articleForm.tags ? articleForm.tags.split(',').map(t => t.trim()) : [];
    
    const body = {
      ...articleForm,
      tags: tagArray
    };

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/articles/${editingId}` : '/api/articles';

    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit article');
      }
      setModalType(null);
      setEditingId(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditArticle = (art) => {
    setEditingId(art.id);
    setArticleForm({
      title: art.title,
      content: art.content,
      description: art.description,
      slug: art.slug,
      category: art.category,
      subcategory: art.subcategory || '',
      tags: art.tags ? art.tags.join(', ') : '',
      status: art.status,
      breakingStatus: !!art.breakingStatus,
      featuredStatus: !!art.featuredStatus,
      featuredImage: art.featuredImage,
      seoTitle: art.seoTitle || '',
      seoDescription: art.seoDescription || ''
    });
    setModalType('article');
    setUploadProgress('');
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm('ఈ వార్తను ఖచ్చితంగా తొలగించాలనుకుంటున్నారా?')) return;
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Category Action: Create
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers,
        body: JSON.stringify(categoryForm)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add category');
      }
      setModalType(null);
      setCategoryForm({ name: '', slug: '', parent: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('ఈ వర్గాన్ని ఖచ్చితంగా తొలగించాలనుకుంటున్నారా?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Breaking Ticker Action: Create/Update
  const handleBreakingSubmit = async (e) => {
    e.preventDefault();
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/breaking/${editingId}` : '/api/breaking';

    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(breakingForm) });
      if (!res.ok) throw new Error('Submission failed');
      setModalType(null);
      setEditingId(null);
      setBreakingForm({ text: '', priority: '1', active: true, expirationTime: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditBreaking = (item) => {
    setEditingId(item.id);
    setBreakingForm({
      text: item.text,
      priority: String(item.priority),
      active: !!item.active,
      expirationTime: item.expirationTime ? item.expirationTime.substring(0, 16) : ''
    });
    setModalType('breaking');
  };

  const handleDeleteBreaking = async (id) => {
    if (!window.confirm('ఈ సమాచారాన్ని తొలగించాలనుకుంటున్నారా?')) return;
    try {
      const res = await fetch(`/api/breaking/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // E-Paper Action: Upload/Create
  const handleEpaperSubmit = async (e) => {
    e.preventDefault();
    if (!epaperForm.pdfUrl) {
      alert('దయచేసి ఇ-పేపర్ పిడిఎఫ్ లేదా చిత్రాన్ని అప్‌లోడ్ చేయండి');
      return;
    }
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
    try {
      const res = await fetch('/api/epaper', {
        method: 'POST',
        headers,
        body: JSON.stringify(epaperForm)
      });
      if (!res.ok) throw new Error('Submission failed');
      setModalType(null);
      setEpaperForm({ date: new Date().toISOString().split('T')[0], title: '', pdfUrl: null });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteEpaper = async (id) => {
    if (!window.confirm('ఈ సంచికను తొలగించాలనుకుంటున్నారా?')) return;
    try {
      const res = await fetch(`/api/epaper/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Advertisement Campaign Action: Schedule
  const handleAdSubmit = async (e) => {
    e.preventDefault();
    if (!adForm.imageUrl) {
      alert('దయచేసి ప్రకటన చిత్రాన్ని అప్‌లోడ్ చేయండి');
      return;
    }
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/ads/${editingId}` : '/api/ads';

    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(adForm) });
      if (!res.ok) throw new Error('Ad scheduling failed');
      setModalType(null);
      setEditingId(null);
      setAdForm({ name: '', zone: 'header-ad', imageUrl: null, targetUrl: '', startDate: '', endDate: '', active: true });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditAd = (ad) => {
    setEditingId(ad.id);
    setAdForm({
      name: ad.name,
      zone: ad.zone,
      imageUrl: ad.imageUrl,
      targetUrl: ad.targetUrl || '',
      startDate: ad.startDate ? ad.startDate.split('T')[0] : '',
      endDate: ad.endDate ? ad.endDate.split('T')[0] : '',
      active: !!ad.active
    });
    setModalType('ad');
    setUploadProgress('');
  };

  const handleDeleteAd = async (id) => {
    if (!window.confirm('ఈ ప్రకటనను తొలగించాలనుకుంటున్నారా?')) return;
    try {
      const res = await fetch(`/api/ads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Backup actions
  const handleTriggerBackup = async () => {
    setUploadProgress('బ్యాకప్ ని సృష్టిస్తోంది...');
    try {
      const res = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Backup failed');
      const data = await res.json();
      setUploadProgress(`✓ బ్యాకప్ పూర్తయింది. ఫైల్: ${data.filename}`);
      loadData();
    } catch (err) {
      setUploadProgress('✕ బ్యాకప్ విఫలమైంది: ' + err.message);
    }
  };

  const handleRestoreBackupSubmit = async () => {
    if (!selectedBackupFile) return;
    if (!window.confirm('హెచ్చరిక: బ్యాకప్ రీస్టోర్ చేయడం వల్ల ప్రస్తుతం ఉన్న డేటా అంతా తుడిచివేయబడుతుంది! మీరే రీస్టోర్ చేయాలనుకుంటున్నారా?')) return;
    setUploadProgress('డేటాను రీస్టోర్ చేస్తోంది...');
    try {
      const res = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ filename: selectedBackupFile })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Restore failed');
      }
      setUploadProgress('✓ విజయవంతంగా డేటా రీస్టోర్ చేయబడింది! పేజీ రీలోడ్ అవుతుంది...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setUploadProgress('✕ రీస్టోర్ విఫలమైంది: ' + err.message);
    }
  };

  if (!user) return null;

  // Filter categories
  const mainCategories = categories.filter(c => !c.parent);
  const subCategories = categories.filter(c => c.parent);

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', color: 'var(--accent-color)', fontFamily: 'var(--font-serif)' }}>నవ తరంగాలు CMS</h2>
          <span style={{ fontSize: '12px', opacity: 0.8 }}>కంటెంట్ మేనేజ్‌మెంట్ సిస్టమ్</span>
        </div>

        <ul className="admin-nav">
          <li className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📊 అవలోకనం (Overview)</li>
          <li className={`admin-nav-item ${activeTab === 'articles' ? 'active' : ''}`} onClick={() => setActiveTab('articles')}>📰 వార్తల నిర్వహణ (Articles)</li>
          
          {user.role !== 'Reporter' && (
            <>
              <li className={`admin-nav-item ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>📁 వర్గాలు (Categories)</li>
              <li className={`admin-nav-item ${activeTab === 'breaking' ? 'active' : ''}`} onClick={() => setActiveTab('breaking')}>⚡ బ్రేకింగ్ న్యూస్ (Breaking)</li>
              <li className={`admin-nav-item ${activeTab === 'epaper' ? 'active' : ''}`} onClick={() => setActiveTab('epaper')}>📑 ఇ-పేపర్ (E-Paper)</li>
              <li className={`admin-nav-item ${activeTab === 'ads' ? 'active' : ''}`} onClick={() => setActiveTab('ads')}>📢 ప్రకటనలు (Ads)</li>
            </>
          )}

          {user.role === 'Super Admin' && (
            <li className={`admin-nav-item ${activeTab === 'backups' ? 'active' : ''}`} onClick={() => setActiveTab('backups')}>💾 బ్యాకప్‌లు & లాగ్స్ (System)</li>
          )}
        </ul>

        <div style={{ marginTop: 'auto', fontSize: '13px', opacity: 0.8, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
          లాగిన్ రోల్: <b>{user.role}</b>
        </div>
      </aside>

      {/* Main Admin Content Panels */}
      <main className="admin-main">
        <header className="admin-header">
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
            {activeTab === 'overview' ? 'డాష్ బోర్డ్ అవలోకనం' :
             activeTab === 'articles' ? 'వార్తల నిర్వహణ ప్యానెల్' :
             activeTab === 'categories' ? 'వర్గాల నిర్వహణ ప్యానెల్' :
             activeTab === 'breaking' ? 'బ్రేకింగ్ న్యూస్ నివేదికల ప్యానెల్' :
             activeTab === 'epaper' ? 'ఇ-పేపర్ పబ్లిషింగ్ ప్యానెల్' :
             activeTab === 'ads' ? 'ప్రకటన ప్రచారాల ప్యానెల్' :
             activeTab === 'backups' ? 'వ్యవస్థ భద్రత & బ్యాకప్ ప్యానెల్' : ''}
          </h1>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>లాగిన్ యూజర్: <b>{user.name}</b></span>
        </header>

        {/* ================= 1. OVERVIEW PANEL ================= */}
        {activeTab === 'overview' && (
          <div>
            <div className="stats-grid">
              <div className="stat-card">
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>మొత్తం వ్యాసాలు</span>
                <span className="stat-val">{stats.totalArticles}</span>
              </div>
              <div className="stat-card">
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>మొత్తం రీడర్ వీక్షణలు</span>
                <span className="stat-val">👁 {stats.totalViews}</span>
              </div>
              <div className="stat-card">
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>క్రియాశీల బ్రేకింగ్ టిక్కర్లు</span>
                <span className="stat-val">{stats.activeBreaking}</span>
              </div>
              <div className="stat-card">
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>షెడ్యూల్డ్ ప్రకటనలు</span>
                <span className="stat-val">{stats.totalAds}</span>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-light)', marginTop: '24px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>త్వరిత మార్గదర్శిని (CMS Guide)</h3>
              <p style={{ fontSize: '14px', lineHeight: '1.8' }}>
                స్వాగతం <b>{user.name}</b>. నవ తరంగాలు వెబ్‌సైట్ నిర్వహణ ప్యానల్‌కు విచ్చేసారు. ఇక్కడ మీరు వార్తలను రాయవచ్చు, వర్గాలను మార్చవచ్చు మరియు బ్యాకప్ లను సురక్షితంగా సేవ్ చేయవచ్చు.
                <br /><br />
                <b>రిపోర్టర్లు:</b> మీరు కొత్త వార్తలను రాసి, డ్రాఫ్ట్ లాగా లేదా రివ్యూ కొరకు ఎడిటర్లకు సమర్పించవచ్చు.
                <br />
                <b>ఎడిటర్లు:</b> మీరు రిపోర్టర్ల వార్తలను సమీక్షించి నేరుగా పబ్లిష్ చేయవచ్చు లేదా సమయాన్ని షెడ్యూల్ చేయవచ్చు. అలాగే ప్రకటనలను నిర్వహించవచ్చు.
                <br />
                <b>సూపర్ అడ్మిన్:</b> పూర్తి నియంత్రణ ఉంటుంది. సిస్టమ్ బ్యాకప్‌లను డౌన్‌లోడ్ లేదా రీస్టోర్ చేయవచ్చు మరియు యూజర్ లాగ్స్ తనిఖీ చేయవచ్చు.
              </p>
            </div>
          </div>
        )}

        {/* ================= 2. ARTICLES PANEL ================= */}
        {activeTab === 'articles' && (
          <div>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  setEditingId(null);
                  setArticleForm({
                    title: '', content: '', description: '', slug: '', category: mainCategories[0]?.name || '', subcategory: '',
                    tags: '', status: user.role === 'Reporter' ? 'Draft' : 'Published', breakingStatus: false, featuredStatus: false, featuredImage: null,
                    seoTitle: '', seoDescription: ''
                  });
                  setModalType('article');
                  setUploadProgress('');
                }} 
                className="btn btn-primary"
              >
                + కొత్త వార్తను సృష్టించండి (Create Article)
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ఐడి</th>
                    <th>శీర్షిక (Title)</th>
                    <th>రచయిత</th>
                    <th>వర్గం</th>
                    <th>స్థితి (Status)</th>
                    <th>తేదీ</th>
                    <th>వీక్షణలు</th>
                    <th>చర్యలు (Actions)</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.length > 0 ? (
                    articles.map(art => (
                      <tr key={art.id}>
                        <td>{art.id}</td>
                        <td style={{ fontWeight: '500', maxWidth: '300px' }}>{art.title}</td>
                        <td>{art.author}</td>
                        <td>{art.category} {art.subcategory && `(${art.subcategory})`}</td>
                        <td>
                          <span className={`status-badge ${art.status.toLowerCase().replace(' ', '')}`}>
                            {art.status}
                          </span>
                        </td>
                        <td>{new Date(art.createdAt).toLocaleDateString('te-IN')}</td>
                        <td>👁 {art.viewCount || 0}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleEditArticle(art)} className="btn btn-muted" style={{ padding: '4px 8px', fontSize: '12px' }}>సవరించు</button>
                            {user.role !== 'Reporter' && (
                              <button onClick={() => handleDeleteArticle(art.id)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>తొలగించు</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>వ్యాసాలు ఏవీ లేవు.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= 3. CATEGORIES PANEL ================= */}
        {activeTab === 'categories' && (
          <div>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalType('category')} className="btn btn-primary">+ కొత్త వర్గం / జిల్లా</button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ఐడి</th>
                    <th>పేరు (Category Name)</th>
                    <th>స్లగ్ (Slug)</th>
                    <th>రకం (Type)</th>
                    <th>చర్యలు</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id}>
                      <td>{cat.id}</td>
                      <td style={{ fontWeight: '500' }}>{cat.name}</td>
                      <td>{cat.slug}</td>
                      <td>{cat.parent ? `ఉపవర్గం / జిల్లా (${cat.parent})` : 'ప్రధాన వర్గం'}</td>
                      <td>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>తొలగించు</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= 4. BREAKING NEWS PANEL ================= */}
        {activeTab === 'breaking' && (
          <div>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  setEditingId(null);
                  setBreakingForm({ text: '', priority: '1', active: true, expirationTime: '' });
                  setModalType('breaking');
                }} 
                className="btn btn-primary"
              >
                + కొత్త బ్రేకింగ్ టిక్కర్ సృష్టించండి
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ఐడి</th>
                    <th>సమాచారం (Ticker Text)</th>
                    <th>ప్రాధాన్యత (Priority)</th>
                    <th>స్థితి</th>
                    <th>గడువు తేదీ (Expiration)</th>
                    <th>చర్యలు</th>
                  </tr>
                </thead>
                <tbody>
                  {breakingNews.length > 0 ? (
                    breakingNews.map(item => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td style={{ fontWeight: '500', maxWidth: '350px' }}>{item.text}</td>
                        <td>{item.priority === 3 ? '🔴 High' : item.priority === 2 ? '🟠 Medium' : '🟡 Low'}</td>
                        <td>
                          <span className={`status-badge ${item.active ? 'published' : 'draft'}`}>
                            {item.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{item.expirationTime ? new Date(item.expirationTime).toLocaleString('te-IN') : 'శాశ్వతం'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleEditBreaking(item)} className="btn btn-muted" style={{ padding: '4px 8px', fontSize: '12px' }}>సవరించు</button>
                            <button onClick={() => handleDeleteBreaking(item.id)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>తొలగించు</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>బ్రేకింగ్ న్యూస్ టిక్కర్లు ఏవీ లేవు.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= 5. E-PAPER PANEL ================= */}
        {activeTab === 'epaper' && (
          <div>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  setEpaperForm({ date: new Date().toISOString().split('T')[0], title: '', pdfUrl: null });
                  setModalType('epaper');
                  setUploadProgress('');
                }} 
                className="btn btn-primary"
              >
                + ఇ-పేపర్ సంచికను అప్‌లోడ్ చేయండి
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ఐడి</th>
                    <th>సంచిక శీర్షిక (Title)</th>
                    <th>తేదీ (Date)</th>
                    <th>పిడిఎఫ్ మార్గం (File Link)</th>
                    <th>చర్యలు</th>
                  </tr>
                </thead>
                <tbody>
                  {epapers.length > 0 ? (
                    epapers.map(ep => (
                      <tr key={ep.id}>
                        <td>{ep.id}</td>
                        <td style={{ fontWeight: '500' }}>{ep.title}</td>
                        <td>{ep.date}</td>
                        <td><a href={ep.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--border-focus)', textDecoration: 'underline' }}>సంచిక చూడండి</a></td>
                        <td>
                          <button onClick={() => handleDeleteEpaper(ep.id)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>తొలగించు</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>ప్రచురించిన ఇ-పేపర్ సంచికలు లేవు.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= 6. ADVERTISEMENTS PANEL ================= */}
        {activeTab === 'ads' && (
          <div>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  setEditingId(null);
                  setAdForm({ name: '', zone: 'header-ad', imageUrl: null, targetUrl: '', startDate: '', endDate: '', active: true });
                  setModalType('ad');
                  setUploadProgress('');
                }} 
                className="btn btn-primary"
              >
                + కొత్త ప్రకటన ప్రచారం సృష్టించండి
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ఐడి</th>
                    <th>ప్రకటనదారు పేరు (Campaign)</th>
                    <th>జోన్ (Position)</th>
                    <th>చిత్రం (Image)</th>
                    <th>లింక్ (Target URL)</th>
                    <th>వ్యవధి (Date Range)</th>
                    <th>చర్యలు</th>
                  </tr>
                </thead>
                <tbody>
                  {ads.length > 0 ? (
                    ads.map(ad => (
                      <tr key={ad.id}>
                        <td>{ad.id}</td>
                        <td style={{ fontWeight: '500' }}>{ad.name}</td>
                        <td><code>{ad.zone}</code></td>
                        <td><img src={ad.imageUrl} alt={ad.name} style={{ width: '80px', height: '40px', objectFit: 'cover' }} /></td>
                        <td><a href={ad.targetUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--border-focus)', fontSize: '12px' }}>{ad.targetUrl}</a></td>
                        <td>{ad.startDate ? `${ad.startDate} నుండి ${ad.endDate}` : 'ఎల్లప్పుడూ క్రియాశీలం'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleEditAd(ad)} className="btn btn-muted" style={{ padding: '4px 8px', fontSize: '12px' }}>సవరించు</button>
                            <button onClick={() => handleDeleteAd(ad.id)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>తొలగించు</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>ప్రకటన ప్రచారాలు ఏవీ లేవు.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= 7. BACKUPS & AUDITS PANEL ================= */}
        {activeTab === 'backups' && user.role === 'Super Admin' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              {/* Backups panel controls */}
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-light)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>
                  సిస్టమ్ బ్యాకప్ సేవలు (Backup Services)
                </h3>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  <button onClick={handleTriggerBackup} className="btn btn-primary">⚡ బ్యాకప్ సృష్టించండి (Trigger Backup)</button>
                </div>
                {uploadProgress && (
                  <div style={{ backgroundColor: 'var(--bg-light)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '20px', fontWeight: '500' }}>
                    {uploadProgress}
                  </div>
                )}
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>మొత్తం నిల్వ బ్యాకప్ ఫైళ్ళు:</h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    {backups.map(bk => (
                      <li key={bk.filename} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                        <span>💾 {bk.filename} ({(bk.size / 1024).toFixed(1)} KB)</span>
                        <button 
                          onClick={() => {
                            setSelectedBackupFile(bk.filename);
                            setModalType('restore');
                            setUploadProgress('');
                          }} 
                          className="btn btn-secondary" 
                          style={{ padding: '2px 8px', fontSize: '11px' }}
                        >
                          రీస్టోర్
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Audit trail */}
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-light)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>
                  ఇటీవలి చర్యల రికార్డు (Admin Activity Logs)
                </h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto', fontSize: '12px' }}>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {auditLogs.slice(0, 50).map(log => (
                      <li key={log.id} style={{ borderBottom: '1px dotted var(--border-color)', paddingBottom: '4px' }}>
                        📅 <code>{new Date(log.timestamp).toLocaleTimeString()}</code> | 
                        👨‍💼 <b>{log.user}</b> | 
                        ⚙️ <b>{log.action}</b> on table <code>{log.table}</code> (ID: {log.recordId})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ======================== MODALS ========================= */}
        {/* ========================================================= */}

        {/* 1. Article Modal */}
        {modalType === 'article' && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
              <button className="modal-close" onClick={() => setModalType(null)}>×</button>
              <h3 style={{ marginBottom: '20px', fontWeight: 'bold' }}>
                {editingId ? 'వ్యాసాన్ని సవరించండి' : 'కొత్త తెలుగు వార్తా వ్యాసం రాయండి'}
              </h3>
              
              <form onSubmit={handleArticleSubmit}>
                <div className="form-group">
                  <label>వార్త శీర్షిక (Telugu Headline) *</label>
                  <input 
                    type="text" required className="form-control" 
                    value={articleForm.title}
                    onChange={e => setArticleForm({...articleForm, title: e.target.value})}
                    placeholder="ఇక్కడ తెలుగు హెడ్‌లైన్ వ్రాయండి..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>వర్గం (Category) *</label>
                    <select 
                      className="form-control" required
                      value={articleForm.category}
                      onChange={e => setArticleForm({...articleForm, category: e.target.value, subcategory: ''})}
                    >
                      <option value="">వర్గాన్ని ఎంచుకోండి</option>
                      {mainCategories.map(c => (
                        <option key={c.id} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {(articleForm.category === 'andhra-pradesh' || articleForm.category === 'telangana') && (
                    <div className="form-group">
                      <label>జిల్లా (District Subcategory)</label>
                      <select 
                        className="form-control"
                        value={articleForm.subcategory}
                        onChange={e => setArticleForm({...articleForm, subcategory: e.target.value})}
                      >
                        <option value="">జిల్లాను ఎంచుకోండి</option>
                        {subCategories.filter(s => s.parent === articleForm.category).map(sub => (
                          <option key={sub.id} value={sub.slug}>{sub.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>ప్రధాన వార్తా చిత్రం (Featured Image URL)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" className="form-control" style={{ flexGrow: 1 }}
                      value={articleForm.featuredImage || ''}
                      onChange={e => setArticleForm({...articleForm, featuredImage: e.target.value})}
                      placeholder="/uploads/file.png లేదా వెబ్ లింక్"
                    />
                    <input 
                      type="file" accept="image/*" style={{ display: 'none' }} id="featured-img-file"
                      onChange={e => handleFileUpload(e, (url) => setArticleForm({...articleForm, featuredImage: url}))}
                    />
                    <label htmlFor="featured-img-file" className="btn btn-secondary" style={{ padding: '10px 14px', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                      📷 ఫైల్ ఎంచుకోండి
                    </label>
                  </div>
                  {uploadProgress && <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{uploadProgress}</span>}
                </div>

                <div className="form-group">
                  <label>వార్తా సమాచారం (Telugu Content Body) *</label>
                  <textarea 
                    rows="8" required className="form-control"
                    value={articleForm.content}
                    onChange={e => setArticleForm({...articleForm, content: e.target.value})}
                    placeholder="మొత్తం తెలుగు కంటెంట్ ఇక్కడ వ్రాయండి..."
                    style={{ resize: 'vertical' }}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>చిన్న వివరణ (Short Description - SEO/Card summary)</label>
                  <textarea 
                    rows="2" className="form-control"
                    value={articleForm.description}
                    onChange={e => setArticleForm({...articleForm, description: e.target.value})}
                    placeholder="కార్డులలో కనిపించే విధంగా చిన్న సారాంశం..."
                  ></textarea>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>ట్యాగ్‌లు (Comma Separated Tags)</label>
                    <input 
                      type="text" className="form-control"
                      value={articleForm.tags}
                      onChange={e => setArticleForm({...articleForm, tags: e.target.value})}
                      placeholder="ఆంధ్రప్రదేశ్, రాజకీయాలు, అమరావతి"
                    />
                  </div>

                  <div className="form-group">
                    <label>URL స్లగ్ (Slug - Custom Link)</label>
                    <input 
                      type="text" className="form-control"
                      value={articleForm.slug}
                      onChange={e => setArticleForm({...articleForm, slug: e.target.value})}
                      placeholder="headline-link-slug"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
                  <div className="form-group">
                    <label>ప్రచురణ స్థితి (Status)</label>
                    <select 
                      className="form-control"
                      value={articleForm.status}
                      disabled={user.role === 'Reporter'}
                      onChange={e => setArticleForm({...articleForm, status: e.target.value})}
                    >
                      <option value="Draft">డ్రాఫ్ట్ (Draft)</option>
                      <option value="Pending Review">సమీక్ష కొరకు (Pending Review)</option>
                      <option value="Published">ప్రచురించు (Published)</option>
                      <option value="Archived">ఆర్కైవ్ (Archived)</option>
                    </select>
                  </div>

                  {user.role !== 'Reporter' && (
                    <>
                      <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', height: '100%', gap: '8px' }}>
                        <input 
                          type="checkbox" id="chk-breaking"
                          checked={articleForm.breakingStatus}
                          onChange={e => setArticleForm({...articleForm, breakingStatus: e.target.checked})}
                        />
                        <label htmlFor="chk-breaking" style={{ cursor: 'pointer' }}>బ్రేకింగ్ వార్తగా ప్రదర్శించు</label>
                      </div>

                      <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', height: '100%', gap: '8px' }}>
                        <input 
                          type="checkbox" id="chk-featured"
                          checked={articleForm.featuredStatus}
                          onChange={e => setArticleForm({...articleForm, featuredStatus: e.target.checked})}
                        />
                        <label htmlFor="chk-featured" style={{ cursor: 'pointer' }}>ముఖ్యాంశాలలో ఉంచు (Slider)</label>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button type="button" className="btn btn-muted" onClick={() => setModalType(null)}>రద్దు</button>
                  <button type="submit" className="btn btn-primary">సేవ్ చేయండి</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. Category Modal */}
        {modalType === 'category' && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="modal-close" onClick={() => setModalType(null)}>×</button>
              <h3 style={{ marginBottom: '20px', fontWeight: 'bold' }}>కొత్త వర్గం లేదా జిల్లాను జోడించండి</h3>
              <form onSubmit={handleCategorySubmit}>
                <div className="form-group">
                  <label>వర్గం / జిల్లా పేరు (Telugu Name) *</label>
                  <input 
                    type="text" required className="form-control"
                    value={categoryForm.name}
                    onChange={e => setCategoryForm({...categoryForm, name: e.target.value})}
                    placeholder="ఉదా: అనంతపురం"
                  />
                </div>
                <div className="form-group">
                  <label>స్లగ్ (URL Slug - English) *</label>
                  <input 
                    type="text" required className="form-control"
                    value={categoryForm.slug}
                    onChange={e => setCategoryForm({...categoryForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                    placeholder="uda: anantapur"
                  />
                </div>
                <div className="form-group">
                  <label>ప్రధాన శీర్షిక (Parent Category)</label>
                  <select 
                    className="form-control"
                    value={categoryForm.parent}
                    onChange={e => setCategoryForm({...categoryForm, parent: e.target.value})}
                  >
                    <option value="">ప్రధాన వర్గంగా సృష్టించు (None)</option>
                    <option value="andhra-pradesh">ఆంధ్రప్రదేశ్ (Andhra Pradesh)</option>
                    <option value="telangana">తెలంగాణ (Telangana)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button type="button" className="btn btn-muted" onClick={() => setModalType(null)}>రద్దు</button>
                  <button type="submit" className="btn btn-primary">జోడించండి</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. Breaking Ticker Modal */}
        {modalType === 'breaking' && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="modal-close" onClick={() => setModalType(null)}>×</button>
              <h3 style={{ marginBottom: '20px', fontWeight: 'bold' }}>బ్రేకింగ్ న్యూస్ టిక్కర్ ని సవరించండి</h3>
              <form onSubmit={handleBreakingSubmit}>
                <div className="form-group">
                  <label>బ్రేకింగ్ వార్త సమాచారం (Telugu Text) *</label>
                  <textarea 
                    rows="3" required className="form-control"
                    value={breakingForm.text}
                    onChange={e => setBreakingForm({...breakingForm, text: e.target.value})}
                    placeholder="ఇక్కడ స్క్రోలింగ్ టెక్స్ట్ వ్రాయండి..."
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>ప్రాధాన్యత స్థాయి (Priority Scale)</label>
                  <select 
                    className="form-control"
                    value={breakingForm.priority}
                    onChange={e => setBreakingForm({...breakingForm, priority: e.target.value})}
                  >
                    <option value="1">కనిష్ట స్థాయి (Low - Yellow Bullet)</option>
                    <option value="2">మధ్యమ స్థాయి (Medium - Orange Bullet)</option>
                    <option value="3">గరిష్ట స్థాయి (High - Red Bullet)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>ఆటో-ఎక్స్‌పైరీ తేదీ & సమయం (Expiration Time)</label>
                  <input 
                    type="datetime-local" className="form-control"
                    value={breakingForm.expirationTime}
                    onChange={e => setBreakingForm({...breakingForm, expirationTime: e.target.value})}
                  />
                </div>

                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" id="chk-breaking-active"
                    checked={breakingForm.active}
                    onChange={e => setBreakingForm({...breakingForm, active: e.target.checked})}
                  />
                  <label htmlFor="chk-breaking-active" style={{ cursor: 'pointer' }}>ప్రస్తుతం టిక్కర్ లో ప్రదర్శించు</label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button type="button" className="btn btn-muted" onClick={() => setModalType(null)}>రద్దు</button>
                  <button type="submit" className="btn btn-primary">సేవ్ చేయండి</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. EPaper Modal */}
        {modalType === 'epaper' && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="modal-close" onClick={() => setModalType(null)}>×</button>
              <h3 style={{ marginBottom: '20px', fontWeight: 'bold' }}>ఇ-పేపర్ కొత్త సంచికను అప్‌లోడ్ చేయండి</h3>
              
              <form onSubmit={handleEpaperSubmit}>
                <div className="form-group">
                  <label>సంచిక శీర్షిక (Edition Title) *</label>
                  <input 
                    type="text" required className="form-control"
                    value={epaperForm.title}
                    onChange={e => setEpaperForm({...epaperForm, title: e.target.value})}
                    placeholder="ఉదా: అమరావతి ప్రధాన సంచిక"
                  />
                </div>

                <div className="form-group">
                  <label>ప్రచురణ తేదీ (Date) *</label>
                  <input 
                    type="date" required className="form-control"
                    value={epaperForm.date}
                    onChange={e => setEpaperForm({...epaperForm, date: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>పిడిఎఫ్ లేదా చిత్ర ఫైల్ (PDF / Page Image) *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" required className="form-control" style={{ flexGrow: 1 }}
                      value={epaperForm.pdfUrl || ''}
                      onChange={e => setEpaperForm({...epaperForm, pdfUrl: e.target.value})}
                      placeholder="/uploads/epaper_file.pdf"
                    />
                    <input 
                      type="file" accept="application/pdf,image/*" style={{ display: 'none' }} id="epaper-pdf-file"
                      onChange={e => handleFileUpload(e, (url) => setEpaperForm({...epaperForm, pdfUrl: url}))}
                    />
                    <label htmlFor="epaper-pdf-file" className="btn btn-secondary" style={{ padding: '10px 14px', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                      📁 ఫైల్ ఎంచుకోండి
                    </label>
                  </div>
                  {uploadProgress && <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{uploadProgress}</span>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button type="button" className="btn btn-muted" onClick={() => setModalType(null)}>రద్దు</button>
                  <button type="submit" className="btn btn-primary">అప్‌లోడ్ చేయండి</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 5. Ad Modal */}
        {modalType === 'ad' && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="modal-close" onClick={() => setModalType(null)}>×</button>
              <h3 style={{ marginBottom: '20px', fontWeight: 'bold' }}>ప్రకటన ప్రచారాన్ని జోడించండి/సవరించండి</h3>
              
              <form onSubmit={handleAdSubmit}>
                <div className="form-group">
                  <label>ప్రకటనదారు పేరు (Campaign/Client Name) *</label>
                  <input 
                    type="text" required className="form-control"
                    value={adForm.name}
                    onChange={e => setAdForm({...adForm, name: e.target.value})}
                    placeholder="ఉదా: రిలయన్స్ డిజిటల్ ఆఫర్లు"
                  />
                </div>

                <div className="form-group">
                  <label>ప్రదర్శన జోన్ (Banner Position) *</label>
                  <select 
                    className="form-control"
                    value={adForm.zone}
                    onChange={e => setAdForm({...adForm, zone: e.target.value})}
                  >
                    <option value="header-ad">హెడర్ బ్యానర్ (728 x 90)</option>
                    <option value="sidebar-ad">సైడ్‌బార్ బాక్స్ (300 x 250)</option>
                    <option value="inline-ad">ఇన్‌లైన్ స్ట్రిప్ (100% x 120)</option>
                    <option value="footer-ad">ఫుటర్ బ్యానర్ (970 x 90)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>ప్రకటన బ్యానర్ చిత్రం (Banner Image) *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" required className="form-control" style={{ flexGrow: 1 }}
                      value={adForm.imageUrl || ''}
                      onChange={e => setAdForm({...adForm, imageUrl: e.target.value})}
                      placeholder="/uploads/banner.png"
                    />
                    <input 
                      type="file" accept="image/*" style={{ display: 'none' }} id="ad-img-file"
                      onChange={e => handleFileUpload(e, (url) => setAdForm({...adForm, imageUrl: url}))}
                    />
                    <label htmlFor="ad-img-file" className="btn btn-secondary" style={{ padding: '10px 14px', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                      📷 ఫైల్ ఎంచుకోండి
                    </label>
                  </div>
                  {uploadProgress && <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{uploadProgress}</span>}
                </div>

                <div className="form-group">
                  <label>టార్గెట్ లింక్ (Target URL / Link)</label>
                  <input 
                    type="url" className="form-control"
                    value={adForm.targetUrl}
                    onChange={e => setAdForm({...adForm, targetUrl: e.target.value})}
                    placeholder="https://client-site.com/offers"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>ప్రారంభ తేదీ (Start Date)</label>
                    <input 
                      type="date" className="form-control"
                      value={adForm.startDate}
                      onChange={e => setAdForm({...adForm, startDate: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>ముగింపు తేదీ (End Date)</label>
                    <input 
                      type="date" className="form-control"
                      value={adForm.endDate}
                      onChange={e => setAdForm({...adForm, endDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" id="chk-ad-active"
                    checked={adForm.active}
                    onChange={e => setAdForm({...adForm, active: e.target.checked})}
                  />
                  <label htmlFor="chk-ad-active" style={{ cursor: 'pointer' }}>ప్రస్తుతం ఈ ప్రకటనను ప్రదర్శించు (Active)</label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button type="button" className="btn btn-muted" onClick={() => setModalType(null)}>రద్దు</button>
                  <button type="submit" className="btn btn-primary">షెడ్యూల్ చేయండి</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 6. Restore Backup Confirmation Modal */}
        {modalType === 'restore' && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="modal-close" onClick={() => setModalType(null)}>×</button>
              <h3 style={{ marginBottom: '16px', color: 'var(--secondary-color)', fontWeight: 'bold' }}>వ్యవస్థ రీస్టోర్ నిర్ధారణ</h3>
              <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                బ్యాకప్ ఫైల్: <b>{selectedBackupFile}</b>
                <br /><br />
                రీస్టోర్ చేయడం వల్ల ప్రస్తుతం వెబ్‌సైట్‌లో ఉన్న మొత్తం డేటా (వ్యాసాలు, వర్గాలు, బ్యానర్లు, మీడియా అప్‌లోడ్‌లు) తొలగించబడి, ఈ బ్యాకప్‌లోని పాత సమాచారంతో భర్తీ చేయబడుతుంది.
              </p>

              {uploadProgress && (
                <div style={{ backgroundColor: 'var(--bg-light)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '20px', fontWeight: '600' }}>
                  {uploadProgress}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-muted" onClick={() => setModalType(null)}>రద్దు</button>
                <button type="button" className="btn btn-secondary" onClick={handleRestoreBackupSubmit}>రీస్టోర్ చేయండి</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

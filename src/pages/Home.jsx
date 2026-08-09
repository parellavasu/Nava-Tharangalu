import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdZone from '../components/AdZone';

export default function Home() {
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [latestArticles, setLatestArticles] = useState([]);
  const [activeSliderIdx, setActiveSliderIdx] = useState(0);

  // Regional news
  const [apDistricts, setApDistricts] = useState([]);
  const [tsDistricts, setTsDistricts] = useState([]);
  const [activeApDistrict, setActiveApDistrict] = useState('');
  const [activeTsDistrict, setActiveTsDistrict] = useState('');
  const [apArticles, setApArticles] = useState([]);
  const [tsArticles, setTsArticles] = useState([]);

  // Category blocks
  const [cinemaArticles, setCinemaArticles] = useState([]);
  const [sportsArticles, setSportsArticles] = useState([]);
  const [techArticles, setTechArticles] = useState([]);
  const [businessArticles, setBusinessArticles] = useState([]);

  // Galleries & Videos
  const [galleries, setGalleries] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Load initial content
  useEffect(() => {
    // 1. Featured articles
    fetch('/api/articles?featured=true&limit=5')
      .then(res => res.json())
      .then(data => setFeaturedArticles(data.articles))
      .catch(err => console.error(err));

    // 2. Latest articles
    fetch('/api/articles?limit=8')
      .then(res => res.json())
      .then(data => setLatestArticles(data.articles))
      .catch(err => console.error(err));

    // 3. District configurations
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        const apD = data.filter(c => c.parent === 'andhra-pradesh');
        const tsD = data.filter(c => c.parent === 'telangana');
        setApDistricts(apD);
        setTsDistricts(tsD);
        if (apD.length > 0) setActiveApDistrict(apD[0].slug);
        if (tsD.length > 0) setActiveTsDistrict(tsD[0].slug);
      })
      .catch(err => console.error(err));

    // 4. Category-specific news
    fetch('/api/articles?category=cinema&limit=4')
      .then(res => res.json())
      .then(data => setCinemaArticles(data.articles))
      .catch(err => console.error(err));

    fetch('/api/articles?category=sports&limit=4')
      .then(res => res.json())
      .then(data => setSportsArticles(data.articles))
      .catch(err => console.error(err));

    fetch('/api/articles?category=technology&limit=4')
      .then(res => res.json())
      .then(data => setTechArticles(data.articles))
      .catch(err => console.error(err));

    fetch('/api/articles?category=business&limit=4')
      .then(res => res.json())
      .then(data => setBusinessArticles(data.articles))
      .catch(err => console.error(err));

    // 5. Media sections
    fetch('/api/galleries')
      .then(res => res.json())
      .then(data => setGalleries(data.slice(0, 4)))
      .catch(err => console.error(err));

    fetch('/api/videos')
      .then(res => res.json())
      .then(data => setVideos(data.slice(0, 4)))
      .catch(err => console.error(err));
  }, []);

  // Fetch Andhra Pradesh district articles when active district changes
  useEffect(() => {
    if (activeApDistrict) {
      fetch(`/api/articles?subcategory=${activeApDistrict}&limit=4`)
        .then(res => res.json())
        .then(data => setApArticles(data.articles))
        .catch(err => console.error(err));
    }
  }, [activeApDistrict]);

  // Fetch Telangana district articles when active district changes
  useEffect(() => {
    if (activeTsDistrict) {
      fetch(`/api/articles?subcategory=${activeTsDistrict}&limit=4`)
        .then(res => res.json())
        .then(data => setTsArticles(data.articles))
        .catch(err => console.error(err));
    }
  }, [activeTsDistrict]);

  // Simple auto rotating featured slider
  useEffect(() => {
    if (featuredArticles.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSliderIdx(prev => (prev + 1) % featuredArticles.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredArticles]);

  const activeSliderPost = featuredArticles[activeSliderIdx];

  return (
    <div className="container" style={{ paddingBottom: '40px' }}>
      {/* 728x90 Header Ad space */}
      <AdZone zone="header-ad" />

      {/* Hero section: Slider + Latest Feed */}
      <section className="hero-grid">
        {/* News slider */}
        {activeSliderPost ? (
          <div className="featured-slider">
            <img 
              className="slider-image" 
              src={activeSliderPost.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80'} 
              alt={activeSliderPost.title} 
            />
            <div className="slider-overlay">
              <span className="badge">ముఖ్యాంశాలు</span>
              <Link to={`/articles/${activeSliderPost.slug}`}>
                <h1 className="slider-title">{activeSliderPost.title}</h1>
              </Link>
              <p style={{ fontSize: '14px', opacity: '0.9', marginBottom: '8px' }}>
                {activeSliderPost.description}
              </p>
              <div className="card-meta" style={{ color: '#fff' }}>
                ✍ {activeSliderPost.author} | 📅 {new Date(activeSliderPost.publishedDate || activeSliderPost.createdAt).toLocaleDateString('te-IN')}
              </div>
            </div>
            {featuredArticles.length > 1 && (
              <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', gap: '6px', zIndex: '10' }}>
                {featuredArticles.map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveSliderIdx(idx)} 
                    style={{ 
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '50%', 
                      border: 'none', 
                      backgroundColor: idx === activeSliderIdx ? 'var(--secondary-color)' : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="featured-slider" style={{ backgroundColor: '#dfe6e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span>వార్తలను లోడ్ చేస్తోంది...</span>
          </div>
        )}

        {/* Latest Feed column */}
        <div>
          <h3 className="section-title section-title-accent">తాజా వార్తలు (Latest News)</h3>
          <div className="sidebar-list">
            {latestArticles.length > 0 ? (
              latestArticles.map(article => (
                <div key={article.id} className="card-row">
                  <img 
                    src={article.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=150&q=80'} 
                    alt={article.title} 
                  />
                  <div className="card-row-content">
                    <Link to={`/articles/${article.slug}`}>
                      <h4 className="card-row-title">{article.title}</h4>
                    </Link>
                    <span className="card-meta">
                      📅 {new Date(article.publishedDate || article.createdAt).toLocaleDateString('te-IN')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>వార్తలు లేవు.</div>
            )}
          </div>
        </div>
      </section>

      {/* Inline Banner Ad space */}
      <AdZone zone="inline-ad" />

      {/* Regional News Area: Andhra Pradesh & Telangana Grids */}
      <section className="hero-grid" style={{ marginTop: '32px' }}>
        {/* Andhra Pradesh district block */}
        <div className="regional-section" style={{ marginTop: 0 }}>
          <h3 className="section-title">ఆంధ్రప్రదేశ్ (Andhra Pradesh)</h3>
          <div className="tab-nav">
            {apDistricts.map(dist => (
              <button 
                key={dist.id} 
                className={`tab-btn ${activeApDistrict === dist.slug ? 'active' : ''}`}
                onClick={() => setActiveApDistrict(dist.slug)}
              >
                {dist.name}
              </button>
            ))}
          </div>
          <div className="tab-grid">
            {apArticles.length > 0 ? (
              apArticles.map(art => (
                <div key={art.id} className="district-card">
                  <img 
                    src={art.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=300&q=80'} 
                    alt={art.title} 
                  />
                  <Link to={`/articles/${art.slug}`}>
                    <h5 className="district-card-title">{art.title}</h5>
                  </Link>
                  <span className="card-meta">
                    📅 {new Date(art.publishedDate || art.createdAt).toLocaleDateString('te-IN')}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', gridColumn: '1/-1' }}>ఈ జిల్లా వార్తలు లేవు.</div>
            )}
          </div>
        </div>

        {/* Telangana district block */}
        <div className="regional-section" style={{ marginTop: 0 }}>
          <h3 className="section-title">తెలంగాణ (Telangana)</h3>
          <div className="tab-nav">
            {tsDistricts.map(dist => (
              <button 
                key={dist.id} 
                className={`tab-btn ${activeTsDistrict === dist.slug ? 'active' : ''}`}
                onClick={() => setActiveTsDistrict(dist.slug)}
              >
                {dist.name}
              </button>
            ))}
          </div>
          <div className="tab-grid">
            {tsArticles.length > 0 ? (
              tsArticles.map(art => (
                <div key={art.id} className="district-card">
                  <img 
                    src={art.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=300&q=80'} 
                    alt={art.title} 
                  />
                  <Link to={`/articles/${art.slug}`}>
                    <h5 className="district-card-title">{art.title}</h5>
                  </Link>
                  <span className="card-meta">
                    📅 {new Date(art.publishedDate || art.createdAt).toLocaleDateString('te-IN')}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', gridColumn: '1/-1' }}>ఈ జిల్లా వార్తలు లేవు.</div>
            )}
          </div>
        </div>
      </section>

      {/* Main Categories block: Cinema, Sports, Tech, Business */}
      <section className="category-blocks">
        {/* Cinema card */}
        <div className="category-block">
          <h3 className="section-title section-title-accent">సినిమా (Cinema)</h3>
          <div className="category-block-articles">
            {cinemaArticles.map((art, idx) => (
              idx === 0 ? (
                <div key={art.id} className="big-card">
                  <img src={art.featuredImage || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80'} alt={art.title} />
                  <Link to={`/articles/${art.slug}`}>
                    <h4 className="big-card-title">{art.title}</h4>
                  </Link>
                  <span className="card-meta">📅 {new Date(art.publishedDate || art.createdAt).toLocaleDateString('te-IN')}</span>
                </div>
              ) : (
                <div key={art.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <Link to={`/articles/${art.slug}`} style={{ fontSize: '14px', fontWeight: '500' }}>{art.title}</Link>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Sports card */}
        <div className="category-block">
          <h3 className="section-title section-title-accent">క్రీడలు (Sports)</h3>
          <div className="category-block-articles">
            {sportsArticles.map((art, idx) => (
              idx === 0 ? (
                <div key={art.id} className="big-card">
                  <img src={art.featuredImage || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=400&q=80'} alt={art.title} />
                  <Link to={`/articles/${art.slug}`}>
                    <h4 className="big-card-title">{art.title}</h4>
                  </Link>
                  <span className="card-meta">📅 {new Date(art.publishedDate || art.createdAt).toLocaleDateString('te-IN')}</span>
                </div>
              ) : (
                <div key={art.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <Link to={`/articles/${art.slug}`} style={{ fontSize: '14px', fontWeight: '500' }}>{art.title}</Link>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Tech & Business */}
        <div className="category-block">
          <h3 className="section-title section-title-accent">టెక్నాలజీ & వ్యాపారం</h3>
          <div className="category-block-articles">
            {techArticles.slice(0, 2).map(art => (
              <div key={art.id} className="card-row">
                <img src={art.featuredImage || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=150&q=80'} alt={art.title} style={{ width: '60px', height: '45px' }} />
                <div className="card-row-content">
                  <Link to={`/articles/${art.slug}`}><h4 className="card-row-title" style={{ fontSize: '13px' }}>{art.title}</h4></Link>
                  <span className="card-meta">టెక్నాలజీ</span>
                </div>
              </div>
            ))}
            {businessArticles.slice(0, 2).map(art => (
              <div key={art.id} className="card-row">
                <img src={art.featuredImage || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=150&q=80'} alt={art.title} style={{ width: '60px', height: '45px' }} />
                <div className="card-row-content">
                  <Link to={`/articles/${art.slug}`}><h4 className="card-row-title" style={{ fontSize: '13px' }}>{art.title}</h4></Link>
                  <span className="card-meta">వ్యాపారం</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video & Photo Gallery Section */}
      <section style={{ backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: 'var(--radius-md)', padding: '24px', marginTop: '32px' }}>
        <h3 className="section-title" style={{ color: 'white', borderBottomColor: 'var(--accent-color)' }}>వీడియో వార్తలు & ఫోటోలు</h3>
        
        {/* Videos Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {videos.map(vid => (
            <div key={vid.id} className="media-card" onClick={() => setSelectedVideo(vid)}>
              <img src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=300&q=80'} alt={vid.title} />
              <div className="play-icon-container">
                <div className="play-icon"></div>
              </div>
              <div className="media-card-overlay">
                <h5 className="media-card-title">{vid.title}</h5>
              </div>
            </div>
          ))}
        </div>

        {/* Galleries Row */}
        <h4 style={{ fontSize: '16px', color: 'var(--accent-color)', marginBottom: '12px', fontWeight: 'bold' }}>తాజా ఫోటో గ్యాలరీలు</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {galleries.map(gal => (
            <Link key={gal.id} to={`/gallery`} className="media-card">
              <img src={gal.images[0] || 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=300&q=80'} alt={gal.title} />
              <div className="media-card-overlay" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                <h5 className="media-card-title">{gal.title}</h5>
                <span style={{ fontSize: '11px', color: 'var(--accent-color)', fontWeight: 'bold' }}>{gal.images.length} చిత్రాలు</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Video Modal Player */}
      {selectedVideo && (
        <div className="modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="modal-content" style={{ maxWidth: '640px', padding: '16px' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedVideo(null)}>×</button>
            <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 'bold', paddingRight: '20px' }}>{selectedVideo.title}</h4>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
              <iframe 
                src={selectedVideo.videoUrl.includes('youtube.com') || selectedVideo.videoUrl.includes('youtu.be') 
                  ? `https://www.youtube.com/embed/${selectedVideo.videoUrl.split('v=')[1] || selectedVideo.videoUrl.split('/').pop()}` 
                  : selectedVideo.videoUrl
                }
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: 'var(--radius-sm)' }}
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* 970x90 Footer Ad space */}
      <AdZone zone="footer-ad" />
    </div>
  );
}

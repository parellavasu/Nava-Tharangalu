import React, { useState, useEffect } from 'react';
import AdZone from '../components/AdZone';

export default function Gallery() {
  const [albums, setAlbums] = useState([]);
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  useEffect(() => {
    fetch('/api/galleries')
      .then(res => res.json())
      .then(data => setAlbums(data))
      .catch(err => console.error(err));
  }, []);

  const openLightbox = (album) => {
    setActiveAlbum(album);
    setActiveImgIdx(0);
  };

  const closeLightbox = () => {
    setActiveAlbum(null);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (activeAlbum) {
      setActiveImgIdx(prev => (prev + 1) % activeAlbum.images.length);
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (activeAlbum) {
      setActiveImgIdx(prev => (prev - 1 + activeAlbum.images.length) % activeAlbum.images.length);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '40px' }}>
      <AdZone zone="header-ad" />

      <h1 className="section-title" style={{ marginTop: '24px' }}>ఫోటో గ్యాలరీ (Photo Gallery)</h1>

      {albums.length > 0 ? (
        <div className="tab-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {albums.map(album => (
            <div 
              key={album.id} 
              className="media-card" 
              onClick={() => openLightbox(album)}
              style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}
            >
              <img 
                src={album.images[0] || 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=400&q=80'} 
                alt={album.title} 
                style={{ height: '180px', objectFit: 'cover', width: '100%' }}
              />
              <div className="media-card-overlay">
                <span className="badge" style={{ fontSize: '9px', backgroundColor: 'var(--accent-color)' }}>
                  {album.images.length} ఫోటోలు
                </span>
                <h4 className="media-card-title">{album.title}</h4>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
                  {album.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <h4>చిత్రాలు లోడ్ అవుతున్నాయి లేదా ఏవీ లేవు.</h4>
        </div>
      )}

      {/* Lightbox Overlay */}
      {activeAlbum && (
        <div className="modal-overlay" onClick={closeLightbox}>
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: '800px', 
              padding: '24px', 
              backgroundColor: '#000', 
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <button className="modal-close" onClick={closeLightbox} style={{ color: '#fff', fontSize: '32px' }}>×</button>
            
            <h3 style={{ color: 'var(--accent-color)', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center', width: '90%' }}>
              {activeAlbum.title}
            </h3>
            <p style={{ fontSize: '13px', color: '#ccc', marginBottom: '16px', textAlign: 'center' }}>
              {activeAlbum.description}
            </p>

            {/* Slider Container */}
            <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              {activeAlbum.images.length > 1 && (
                <button 
                  onClick={handlePrev} 
                  style={{ 
                    position: 'absolute', 
                    left: '16px', 
                    background: 'rgba(0,0,0,0.6)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    fontSize: '20px',
                    cursor: 'pointer',
                    zIndex: '10'
                  }}
                >
                  ❮
                </button>
              )}

              <img 
                src={activeAlbum.images[activeImgIdx]} 
                alt={`${activeAlbum.title} - ఫోటో ${activeImgIdx + 1}`} 
                style={{ maxHigh: '500px', objectFit: 'contain', width: '100%' }}
              />

              {activeAlbum.images.length > 1 && (
                <button 
                  onClick={handleNext} 
                  style={{ 
                    position: 'absolute', 
                    right: '16px', 
                    background: 'rgba(0,0,0,0.6)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    fontSize: '20px',
                    cursor: 'pointer',
                    zIndex: '10'
                  }}
                >
                  ❯
                </button>
              )}
            </div>

            {/* Page Count */}
            <div style={{ marginTop: '16px', fontSize: '14px', fontWeight: 'bold' }}>
              ఫోటో {activeImgIdx + 1} / {activeAlbum.images.length}
            </div>
          </div>
        </div>
      )}

      <AdZone zone="footer-ad" />
    </div>
  );
}

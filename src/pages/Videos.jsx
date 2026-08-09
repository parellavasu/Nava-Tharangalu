import React, { useState, useEffect } from 'react';
import AdZone from '../components/AdZone';

export default function Videos() {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    fetch('/api/videos')
      .then(res => res.json())
      .then(data => setVideos(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="container" style={{ paddingBottom: '40px' }}>
      <AdZone zone="header-ad" />

      <h1 className="section-title" style={{ marginTop: '24px' }}>వీడియో వార్తలు (Video News)</h1>

      {videos.length > 0 ? (
        <div className="tab-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {videos.map(vid => (
            <div 
              key={vid.id} 
              className="media-card" 
              onClick={() => setSelectedVideo(vid)}
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <img 
                src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=400&q=80'} 
                alt={vid.title} 
                style={{ height: '180px', objectFit: 'cover', width: '100%' }}
              />
              <div className="play-icon-container">
                <div className="play-icon"></div>
              </div>
              <div className="media-card-overlay">
                <span className="badge" style={{ fontSize: '9px', backgroundColor: 'var(--secondary-color)' }}>
                  {vid.category || 'వీడియో'}
                </span>
                <h4 className="media-card-title">{vid.title}</h4>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                  📅 {new Date(vid.createdAt).toLocaleDateString('te-IN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <h4>వీడియో వార్తలు ఏవీ లేవు.</h4>
        </div>
      )}

      {/* Video Modal Player */}
      {selectedVideo && (
        <div className="modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="modal-content" style={{ maxWidth: '720px', padding: '20px' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedVideo(null)}>×</button>
            
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', paddingRight: '24px', color: 'var(--primary-color)' }}>
              {selectedVideo.title}
            </h3>

            {/* Embedded Iframe Player */}
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', backgroundColor: '#000', borderRadius: 'var(--radius-sm)' }}>
              <iframe 
                src={selectedVideo.videoUrl.includes('youtube.com') || selectedVideo.videoUrl.includes('youtu.be') 
                  ? `https://www.youtube.com/embed/${selectedVideo.videoUrl.split('v=')[1] || selectedVideo.videoUrl.split('/').pop()}` 
                  : selectedVideo.videoUrl
                }
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              ></iframe>
            </div>
          </div>
        </div>
      )}

      <AdZone zone="footer-ad" />
    </div>
  );
}

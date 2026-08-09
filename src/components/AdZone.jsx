import React, { useState, useEffect } from 'react';

export default function AdZone({ zone }) {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    fetch('/api/ads')
      .then(res => res.json())
      .then(data => setAds(data))
      .catch(err => console.error('Error fetching ads:', err));
  }, []);

  const activeAd = ads.find(ad => ad.zone === zone);

  let zoneClass = 'ad-slot';
  let placeholderText = 'ప్రకటన (Advertisement)';
  let sizeText = '';

  switch (zone) {
    case 'header-ad':
      zoneClass += ' header-ad';
      sizeText = '728 x 90';
      break;
    case 'sidebar-ad':
      zoneClass += ' sidebar-ad';
      sizeText = '300 x 250';
      break;
    case 'inline-ad':
      zoneClass += ' inline-ad';
      sizeText = '100% x 120';
      break;
    case 'footer-ad':
      zoneClass += ' footer-ad';
      sizeText = '970 x 90';
      break;
    default:
      break;
  }

  if (activeAd) {
    return (
      <div className={zoneClass}>
        <span className="ad-label">ప్రకటన</span>
        <a href={activeAd.targetUrl || '#'} target="_blank" rel="noopener noreferrer">
          <img 
            src={activeAd.imageUrl} 
            alt={activeAd.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </a>
      </div>
    );
  }

  // Render a beautiful, styled placeholder encouraging advertising
  return (
    <div className={zoneClass} style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: '12px',
      background: 'linear-gradient(135deg, rgba(230, 126, 34, 0.05), rgba(13, 35, 58, 0.05))',
      border: '1px dashed var(--border-color)',
      color: 'var(--text-muted)',
      textAlign: 'center'
    }}>
      <span className="ad-label" style={{ fontWeight: '600' }}>{placeholderText}</span>
      <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '4px' }}>
        నవ తరంగాలు లో ప్రకటనల కోసం సంప్రదించండి
      </span>
      <span style={{ fontSize: '11px' }}>ads@navatharangalu.com | {sizeText}</span>
    </div>
  );
}

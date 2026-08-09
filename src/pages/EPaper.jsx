import React, { useState, useEffect } from 'react';
import AdZone from '../components/AdZone';

export default function EPaper() {
  const [editions, setEditions] = useState([]);
  const [selectedEdition, setSelectedEdition] = useState(null);
  const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetch('/api/epaper')
      .then(res => res.json())
      .then(data => {
        setEditions(data);
        // Default to the latest uploaded edition if available, otherwise current date
        if (data.length > 0) {
          setSelectedEdition(data[0]);
          setActiveDate(data[0].date);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleDateChange = (dateVal) => {
    setActiveDate(dateVal);
    const found = editions.find(ed => ed.date === dateVal);
    setSelectedEdition(found || null);
  };

  return (
    <div className="container" style={{ paddingBottom: '40px' }}>
      <AdZone zone="header-ad" />

      <h1 className="section-title" style={{ marginTop: '24px' }}>నవ తరంగాలు ఇ-పేపర్ (E-Paper)</h1>

      <div className="epaper-grid">
        {/* Calendar Picker Sidebar */}
        <div className="date-picker-card">
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>
            సంచిక తేదీని ఎంచుకోండి
          </h3>
          <div className="form-group">
            <input 
              type="date" 
              className="form-control" 
              value={activeDate}
              onChange={e => handleDateChange(e.target.value)}
            />
          </div>
          
          <div style={{ marginTop: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>లభించే ఇతర సంచికలు:</h4>
            {editions.length > 0 ? (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                {editions.slice(0, 10).map(ed => (
                  <li key={ed.id}>
                    <button 
                      onClick={() => handleDateChange(ed.date)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: activeDate === ed.date ? 'var(--secondary-color)' : 'var(--text-dark)', 
                        fontWeight: activeDate === ed.date ? 'bold' : 'normal',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      📰 {ed.title} ({new Date(ed.date).toLocaleDateString('te-IN')})
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>సంచికలు లేవు.</span>
            )}
          </div>
        </div>

        {/* E-Paper Viewer Panel */}
        <div className="epaper-view-card">
          {selectedEdition ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{selectedEdition.title}</h3>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  ప్రచురణ తేదీ: {new Date(selectedEdition.date).toLocaleDateString('te-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>

              {/* PDF embed or link download fallback */}
              {selectedEdition.pdfUrl.endsWith('.pdf') ? (
                <div style={{ width: '100%', height: '650px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <object 
                    data={`${selectedEdition.pdfUrl}#toolbar=0&navpanes=0`} 
                    type="application/pdf" 
                    width="100%" 
                    height="100%"
                  >
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                      <p style={{ marginBottom: '16px' }}>ఈ బ్రౌజర్ నేరుగా పిడిఎఫ్ ప్రదర్శనకు మద్దతు ఇవ్వదు.</p>
                      <a href={selectedEdition.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                        📥 ఇ-పేపర్ పిడిఎఫ్ డౌన్‌లోడ్ చేయండి
                      </a>
                    </div>
                  </object>
                </div>
              ) : (
                <div style={{ width: '100%', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <img 
                    src={selectedEdition.pdfUrl} 
                    alt={selectedEdition.title} 
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📰</span>
              <h3>ఈ తేదీన ఇ-పేపర్ ప్రచురించబడలేదు.</h3>
              <p style={{ marginTop: '8px' }}>దయచేసి పై క్యాలెండర్ నుండి అందుబాటులో ఉన్న వేరే తేదీని ఎంచుకోండి.</p>
            </div>
          )}
        </div>
      </div>

      <AdZone zone="footer-ad" />
    </div>
  );
}

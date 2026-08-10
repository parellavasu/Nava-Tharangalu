import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdZone from '../components/AdZone';

export default function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [latestArticles, setLatestArticles] = useState([]);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch current article
    fetch(`/api/articles/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('వ్యాసం లభించలేదు');
        return res.json();
      })
      .then(data => {
        setArticle(data);
        setLoading(false);
        
        // Fetch related articles (same category)
        fetch(`/api/articles?category=${data.category}&limit=5`)
          .then(res => res.json())
          .then(relatedData => {
            // Exclude current article from related
            const filtered = relatedData.articles.filter(a => a.id !== data.id);
            setRelatedArticles(filtered);
          });
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    // Fetch latest news sidebar
    fetch('/api/articles?limit=6')
      .then(res => res.json())
      .then(data => setLatestArticles(data.articles))
      .catch(err => console.error(err));
  }, [slug]);

  // Social share triggers
  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article?.title || '')}`, '_blank');
  };

  const shareOnWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent((article?.title || '') + ' ' + window.location.href)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h3>వ్యాసాన్ని లోడ్ చేస్తోంది...</h3>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--secondary-color)', marginBottom: '16px' }}>క్షమించండి! ఈ వార్త కనుగొనబడలేదు.</h3>
        <Link to="/" className="btn btn-primary">హోమ్ పేజీకి వెళ్ళండి</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '40px' }}>
      {/* Dynamic Header Ad Slot */}
      <AdZone zone="header-ad" />

      <div className="article-grid">
        {/* Main Article Body */}
        <main>
          {/* Breadcrumbs */}
          <div className="breadcrumb">
            <Link to="/">హోమ్</Link> &gt; 
            <Link to={`/search?category=${article.category}`}>{article.category}</Link> 
            {article.subcategory && (
              <> &gt; <Link to={`/search?subcategory=${article.subcategory}`}>{article.subcategory}</Link></>
            )}
          </div>

          <article>
            <h1 className="article-title">{article.title}</h1>
            
            {/* Meta statistics */}
            <div className="article-meta-block">
              <div>
                <span>✍ <b>{article.author}</b></span>
                <span style={{ marginLeft: '16px' }}>📅 {new Date(article.publishedDate || article.createdAt).toLocaleString('te-IN')}</span>
              </div>
              <div>
                <span>👁 {article.viewCount || 0} వీక్షణలు</span>
              </div>
            </div>

            {/* Featured Image */}
            <img 
              className="article-featured-img" 
              src={article.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80'} 
              alt={article.title} 
            />

            {/* Body Telugu text */}
            <div className="article-content">
              {(article.content || '').split('\n').map((paragraph, index) => (
                paragraph.trim() && <p key={index}>{paragraph}</p>
              ))}
            </div>

            {/* Additional Images (Photo album embedded) */}
            {article.additionalImages && article.additionalImages.length > 0 && (
              <div style={{ marginTop: '32px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>సంబంధిత చిత్రాలు</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {article.additionalImages.map((imgUrl, idx) => (
                    <img 
                      key={idx} 
                      src={imgUrl} 
                      alt={`వార్త చిత్రం ${idx + 1}`} 
                      style={{ height: '140px', objectFit: 'cover', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                      onClick={() => window.open(imgUrl, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tags section */}
            {article.tags && article.tags.length > 0 && (
              <div className="tag-container">
                <span style={{ fontWeight: '600', alignSelf: 'center', fontSize: '13px' }}>ట్యాగ్‌లు:</span>
                {article.tags.map((tag, idx) => (
                  <Link key={idx} to={`/search?q=${encodeURIComponent(tag)}`} className="tag">
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Social shares */}
            <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', margin: '32px 0', padding: '16px 0' }}>
              <h5 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 'bold' }}>ఈ వార్తను పంచుకోండి:</h5>
              <div className="share-bar">
                <button onClick={shareOnFacebook} className="share-btn fb">Facebook</button>
                <button onClick={shareOnTwitter} className="share-btn tw">Twitter / X</button>
                <button onClick={shareOnWhatsApp} className="share-btn wa">WhatsApp</button>
              </div>
            </div>
          </article>

          {/* Related News list */}
          {relatedArticles.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <h3 className="section-title section-title-accent">సంబంధిత వార్తలు (Related News)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                {relatedArticles.map(art => (
                  <div key={art.id} className="district-card">
                    <img 
                      src={art.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=300&q=80'} 
                      alt={art.title} 
                      style={{ height: '120px', objectFit: 'cover' }}
                    />
                    <Link to={`/articles/${art.slug}`}>
                      <h5 className="district-card-title" style={{ fontSize: '13px' }}>{art.title}</h5>
                    </Link>
                    <span className="card-meta">
                      📅 {new Date(art.publishedDate || art.createdAt).toLocaleDateString('te-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Sidebar Widgets */}
        <aside>
          {/* Sidebar Advertisement Slot */}
          <AdZone zone="sidebar-ad" />

          {/* Latest News sidebar */}
          <div style={{ marginTop: '32px' }}>
            <h3 className="section-title">తాజా వార్తలు</h3>
            <div className="sidebar-list">
              {latestArticles.map(art => (
                <div key={art.id} className="card-row">
                  <img src={art.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80'} alt={art.title} style={{ width: '60px', height: '45px' }} />
                  <div className="card-row-content">
                    <Link to={`/articles/${art.slug}`}>
                      <h4 className="card-row-title" style={{ fontSize: '13px' }}>{art.title}</h4>
                    </Link>
                    <span className="card-meta" style={{ fontSize: '10px' }}>
                      {new Date(art.publishedDate || art.createdAt).toLocaleDateString('te-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Footer banner ad slot */}
      <AdZone zone="footer-ad" />
    </div>
  );
}

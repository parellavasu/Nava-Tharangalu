import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AdZone from '../components/AdZone';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Form states matching URL params
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [subcategory, setSubcategory] = useState(searchParams.get('subcategory') || '');
  const [year, setYear] = useState(searchParams.get('year') || '');
  const [month, setMonth] = useState(searchParams.get('month') || '');
  
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Archive options
  const startYear = 2020;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i).reverse();
  const months = [
    { value: '1', name: 'జనవరి (January)' },
    { value: '2', name: 'ఫిబ్రవరి (February)' },
    { value: '3', name: 'మార్చి (March)' },
    { value: '4', name: 'ఏప్రిల్ (April)' },
    { value: '5', name: 'మే (May)' },
    { value: '6', name: 'జూన్ (June)' },
    { value: '7', name: 'జూలై (July)' },
    { value: '8', name: 'ఆగస్టు (August)' },
    { value: '9', name: 'సెప్టెంబరు (September)' },
    { value: '10', name: 'అక్టోబరు (October)' },
    { value: '11', name: 'నవంబరు (November)' },
    { value: '12', name: 'డిసెంబరు (December)' },
  ];

  // Fetch category list
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data.filter(c => !c.parent));
        setSubcategories(data.filter(c => c.parent));
      })
      .catch(err => console.error(err));
  }, []);

  // Fetch results when search params or page changes
  useEffect(() => {
    setLoading(true);
    const qStr = searchParams.get('q') || '';
    const catStr = searchParams.get('category') || '';
    const subcatStr = searchParams.get('subcategory') || '';
    const yrStr = searchParams.get('year') || '';
    const moStr = searchParams.get('month') || '';
    const pgStr = searchParams.get('page') || '1';

    // Update form controls to match URLs
    setQuery(qStr);
    setCategory(catStr);
    setSubcategory(subcatStr);
    setYear(yrStr);
    setMonth(moStr);
    setPage(Number(pgStr));

    const url = `/api/articles?q=${encodeURIComponent(qStr)}&category=${catStr}&subcategory=${subcatStr}&year=${yrStr}&month=${moStr}&page=${pgStr}&limit=12`;
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setResults(data.articles);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [searchParams]);

  // Handle filter submit
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const params = {};
    if (query) params.q = query;
    if (category) params.category = category;
    if (subcategory) params.subcategory = subcategory;
    if (year) params.year = year;
    if (month) params.month = month;
    params.page = '1'; // Reset page on filter changes
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const currentParams = Object.fromEntries(searchParams.entries());
    currentParams.page = String(newPage);
    setSearchParams(currentParams);
  };

  // Subcategories matching selected parent category
  const filteredSubcategories = subcategories.filter(sub => sub.parent === category);

  return (
    <div className="container" style={{ paddingBottom: '40px' }}>
      <AdZone zone="header-ad" />

      <h1 className="section-title" style={{ marginTop: '24px' }}>వార్తల శోధన & ఆర్కైవ్ (Search & Archive)</h1>

      {/* Advanced Filter Panel */}
      <form onSubmit={handleFilterSubmit} className="filter-panel">
        <input 
          type="text" 
          placeholder="కీవర్డ్ వ్రాయండి..." 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          style={{ flexGrow: 1, minWidth: '200px' }}
        />

        <select value={category} onChange={e => { setCategory(e.target.value); setSubcategory(''); }}>
          <option value="">అన్ని వర్గాలు (All Categories)</option>
          {categories.map(c => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>

        {/* Show district drop down only if AP or TS is active */}
        {(category === 'andhra-pradesh' || category === 'telangana') && (
          <select value={subcategory} onChange={e => setSubcategory(e.target.value)}>
            <option value="">అన్ని జిల్లాలు (All Districts)</option>
            {filteredSubcategories.map(sub => (
              <option key={sub.id} value={sub.slug}>{sub.name}</option>
            ))}
          </select>
        )}

        <select value={year} onChange={e => setYear(e.target.value)}>
          <option value="">సంవత్సరం (Year)</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select value={month} onChange={e => setMonth(e.target.value)}>
          <option value="">నెల (Month)</option>
          {months.map(m => (
            <option key={m.value} value={m.value}>{m.name}</option>
          ))}
        </select>

        <button type="submit" className="btn btn-primary" style={{ padding: '8px 24px' }}>శోధించు</button>
      </form>

      {/* Search results */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h4>వార్తలను వెతుకుతోంది...</h4>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
            మొత్తం <b>{total}</b> వార్తలు కనుగొనబడ్డాయి.
          </div>

          {results.length > 0 ? (
            <div className="tab-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {results.map(art => (
                <div key={art.id} className="district-card" style={{ backgroundColor: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-light)' }}>
                  <img 
                    src={art.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=300&q=80'} 
                    alt={art.title} 
                    style={{ height: '160px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1, justifyContent: 'space-between' }}>
                    <div>
                      <span className="badge" style={{ fontSize: '10px' }}>{art.category}</span>
                      <Link to={`/articles/${art.slug}`}>
                        <h4 className="district-card-title" style={{ fontSize: '15px', color: 'var(--primary-color)' }}>{art.title}</h4>
                      </Link>
                    </div>
                    <span className="card-meta">
                      📅 {new Date(art.publishedDate || art.createdAt).toLocaleDateString('te-IN')} | ✍ {art.author}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <h4>ఫలితాలు ఏవీ లేవు. దయచేసి ఇతర కీవర్డ్స్ తో ప్రయత్నించండి.</h4>
            </div>
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px' }}>
              <button 
                disabled={page === 1} 
                onClick={() => handlePageChange(page - 1)} 
                className="btn btn-muted"
                style={{ padding: '6px 12px' }}
              >
                ◀ వెనుకకు
              </button>
              <span style={{ alignSelf: 'center', fontSize: '14px', fontWeight: '600' }}>
                పేజీ {page} / {totalPages}
              </span>
              <button 
                disabled={page === totalPages} 
                onClick={() => handlePageChange(page + 1)} 
                className="btn btn-muted"
                style={{ padding: '6px 12px' }}
              >
                ముందుకు ▶
              </button>
            </div>
          )}
        </div>
      )}

      <AdZone zone="footer-ad" />
    </div>
  );
}

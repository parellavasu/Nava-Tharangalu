import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from './db.js';
import { authenticate, loginUser, logoutUser, requireRole } from './auth.js';
import { createBackup, listBackups, verifyBackup, restoreBackup } from './backup.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(authenticate);

// Configure file upload directory
const UPLOADS_DIR = path.resolve('public/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Setup Multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf' || ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp') {
      cb(null, true);
    } else {
      cb(new Error('పిడిఎఫ్ లేదా చిత్రాలు (.png, .jpg, .webp) మాత్రమే అనుమతించబడతాయి!'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// ================= AUTHENTICATION ENDPOINTS =================

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'యూజర్ పేరు మరియు పాస్‌వర్డ్ అవసరం' });
  }
  const session = loginUser(username, password);
  if (!session) {
    return res.status(401).json({ error: 'చెల్లని యూజర్ పేరు లేదా పాస్‌వర్డ్' });
  }
  res.json(session);
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    logoutUser(token);
  }
  res.json({ success: true, message: 'విజయవంతంగా నిష్క్రమించారు' });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'లాగిన్ అవ్వలేదు' });
  }
  res.json({ user: req.user });
});

// ================= MEDIA FILE UPLOADS =================

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'ఫైల్ అప్‌లోడ్ చేయబడలేదు' });
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

app.post('/api/upload-multiple', upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'ఫైళ్ళు అప్‌లోడ్ చేయబడలేదు' });
  }
  const urls = req.files.map(file => `/uploads/${file.filename}`);
  res.json({ urls });
});

// ================= NEWS ARTICLES ENDPOINTS =================

// Public list of articles (Published state only)
app.get('/api/articles', (req, res) => {
  const { q, category, subcategory, author, year, month, breaking, featured, limit = 20, page = 1 } = req.query;
  
  let articles = db.read('articles').filter(a => a.status === 'Published');

  // Filter out scheduled articles that aren't ready to release yet
  const now = new Date();
  articles = articles.filter(a => !a.publishedDate || new Date(a.publishedDate) <= now);

  // Search Telugu/English text
  if (q) {
    const query = q.toLowerCase();
    articles = articles.filter(a => 
      a.title?.toLowerCase().includes(query) ||
      a.content?.toLowerCase().includes(query) ||
      a.description?.toLowerCase().includes(query) ||
      a.tags?.some(t => t.toLowerCase().includes(query))
    );
  }

  // Categories & Regional Subcategories
  if (category) {
    articles = articles.filter(a => a.category === category);
  }
  if (subcategory) {
    articles = articles.filter(a => a.subcategory === subcategory);
  }
  if (author) {
    articles = articles.filter(a => a.author === author);
  }

  // Date filters
  if (year) {
    articles = articles.filter(a => new Date(a.publishedDate || a.createdAt).getFullYear() === Number(year));
  }
  if (month) {
    articles = articles.filter(a => new Date(a.publishedDate || a.createdAt).getMonth() === Number(month) - 1);
  }

  // Core status flags
  if (breaking === 'true') {
    articles = articles.filter(a => a.breakingStatus === true);
  }
  if (featured === 'true') {
    articles = articles.filter(a => a.featuredStatus === true);
  }

  // Order by published date (newest first)
  articles.sort((a, b) => new Date(b.publishedDate || b.createdAt) - new Date(a.publishedDate || a.createdAt));

  // Pagination
  const total = articles.length;
  const start = (Number(page) - 1) * Number(limit);
  const end = start + Number(limit);
  const data = articles.slice(start, end);

  res.json({
    articles: data,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit))
  });
});

// Admin list of articles (All states: Draft, Scheduled, Published, etc.)
app.get('/api/articles/admin', requireRole(['Super Admin', 'Editor', 'Reporter']), (req, res) => {
  let articles = db.read('articles');

  // Reporters can only see/manage their own submissions
  if (req.user.role === 'Reporter') {
    articles = articles.filter(a => a.author === req.user.name);
  }

  articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(articles);
});

// Get single article by ID or slug
app.get('/api/articles/:identifier', (req, res) => {
  const param = req.params.identifier;
  let article = null;

  if (/^\d+$/.test(param)) {
    article = db.findOne('articles', { id: Number(param) });
  } else {
    article = db.findOne('articles', { slug: param });
  }

  if (!article) {
    return res.status(404).json({ error: 'వ్యాసం కనుగొనబడలేదు' });
  }

  // Increment view counts for published public lookups
  if (article.status === 'Published' && req.query.view !== 'false') {
    const updatedViews = (article.viewCount || 0) + 1;
    article = db.update('articles', article.id, { viewCount: updatedViews }, 'viewer');
  }

  res.json(article);
});

// Create news article
app.post('/api/articles', requireRole(['Super Admin', 'Editor', 'Reporter']), (req, res) => {
  const {
    title, content, description, slug, featuredImage, additionalImages = [],
    category, subcategory, tags = [], status = 'Draft', breakingStatus = false,
    featuredStatus = false, publishedDate, seoTitle, seoDescription, socialSharingImage
  } = req.body;

  if (!title || !content || !category) {
    return res.status(400).json({ error: 'శీర్షిక, సమాచారం మరియు వర్గం తప్పనిసరి' });
  }

  const generatedSlug = slug || title.toLowerCase()
    .replace(/[^\w\s\u0c00-\u0c7f-]/g, '') // Keep alphanumeric + Telugu chars
    .trim()
    .replace(/[\s_]+/g, '-');

  // Verify slug uniqueness
  if (db.findOne('articles', { slug: generatedSlug })) {
    return res.status(400).json({ error: 'ఈ శీర్షికతో ఇప్పటికే ఒక వ్యాసం ఉంది (Slug collision)' });
  }

  // Enforce role publishing limits
  let finalStatus = status;
  let finalPublishedDate = publishedDate;

  if (req.user.role === 'Reporter') {
    // Reporters can only save drafts or submit for review
    if (finalStatus !== 'Draft' && finalStatus !== 'Pending Review') {
      finalStatus = 'Pending Review';
    }
  }

  if (finalStatus === 'Published' && !finalPublishedDate) {
    finalPublishedDate = new Date().toISOString();
  }

  const newArticle = db.insert('articles', {
    title,
    content,
    description: description || content.substring(0, 150) + '...',
    slug: generatedSlug,
    featuredImage: featuredImage || null,
    additionalImages,
    author: req.user.name,
    category,
    subcategory: subcategory || null,
    tags,
    status: finalStatus,
    breakingStatus: !!breakingStatus,
    featuredStatus: !!featuredStatus,
    viewCount: 0,
    publishedDate: finalPublishedDate || null,
    seoTitle: seoTitle || title,
    seoDescription: seoDescription || description || '',
    socialSharingImage: socialSharingImage || featuredImage || null
  });

  res.status(201).json(newArticle);
});

// Update article
app.put('/api/articles/:id', requireRole(['Super Admin', 'Editor', 'Reporter']), (req, res) => {
  const id = Number(req.params.id);
  const article = db.findOne('articles', { id });
  if (!article) {
    return res.status(404).json({ error: 'వ్యాసం కనుగొనబడలేదు' });
  }

  // Reporters can only update their own drafts
  if (req.user.role === 'Reporter' && article.author !== req.user.name) {
    return res.status(403).json({ error: 'ఈ వ్యాసాన్ని సవరించడానికి మీకు అనుమతి లేదు' });
  }

  const {
    title, content, description, slug, featuredImage, additionalImages,
    category, subcategory, tags, status, breakingStatus,
    featuredStatus, publishedDate, seoTitle, seoDescription, socialSharingImage
  } = req.body;

  const updates = {};
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;
  if (description !== undefined) updates.description = description;
  if (slug !== undefined) updates.slug = slug;
  if (featuredImage !== undefined) updates.featuredImage = featuredImage;
  if (additionalImages !== undefined) updates.additionalImages = additionalImages;
  if (category !== undefined) updates.category = category;
  if (subcategory !== undefined) updates.subcategory = subcategory;
  if (tags !== undefined) updates.tags = tags;
  if (breakingStatus !== undefined) updates.breakingStatus = !!breakingStatus;
  if (featuredStatus !== undefined) updates.featuredStatus = !!featuredStatus;
  if (seoTitle !== undefined) updates.seoTitle = seoTitle;
  if (seoDescription !== undefined) updates.seoDescription = seoDescription;
  if (socialSharingImage !== undefined) updates.socialSharingImage = socialSharingImage;

  // Enforce status logic based on user role
  if (status !== undefined) {
    if (req.user.role === 'Reporter') {
      if (status === 'Draft' || status === 'Pending Review') {
        updates.status = status;
      }
    } else {
      updates.status = status;
      if (status === 'Published' && (!article.publishedDate && !publishedDate)) {
        updates.publishedDate = new Date().toISOString();
      }
    }
  }

  if (publishedDate !== undefined && req.user.role !== 'Reporter') {
    updates.publishedDate = publishedDate;
  }

  const updated = db.update('articles', id, updates, req.user.name);
  res.json(updated);
});

// Delete article
app.delete('/api/articles/:id', requireRole(['Super Admin', 'Editor']), (req, res) => {
  const id = Number(req.params.id);
  const success = db.delete('articles', id, req.user.name);
  if (!success) {
    return res.status(404).json({ error: 'వ్యాసం కనుగొనబడలేదు' });
  }
  res.json({ success: true, message: 'వ్యాసం విజయవంతంగా తొలగించబడింది' });
});

// ================= CATEGORIES ENDPOINTS =================

app.get('/api/categories', (req, res) => {
  res.json(db.read('categories'));
});

app.post('/api/categories', requireRole(['Super Admin', 'Editor']), (req, res) => {
  const { name, slug, parent } = req.body;
  if (!name || !slug) {
    return res.status(400).json({ error: 'వర్గం పేరు మరియు స్లగ్ తప్పనిసరి' });
  }

  if (db.findOne('categories', { slug })) {
    return res.status(400).json({ error: 'ఈ స్లగ్‌తో ఇప్పటికే వర్గం ఉంది' });
  }

  const newCat = db.insert('categories', { name, slug, parent: parent || null });
  res.status(201).json(newCat);
});

app.delete('/api/categories/:id', requireRole(['Super Admin', 'Editor']), (req, res) => {
  const id = Number(req.params.id);
  const success = db.delete('categories', id, req.user.name);
  if (!success) {
    return res.status(404).json({ error: 'వర్గం కనుగొనబడలేదు' });
  }
  res.json({ success: true, message: 'వర్గం తొలగించబడింది' });
});

// ================= BREAKING NEWS TICKER ENDPOINTS =================

// Public active breaking news
app.get('/api/breaking', (req, res) => {
  const items = db.read('breaking').filter(b => b.active);
  const now = new Date();

  // Filter by start and expiration times
  const activeItems = items.filter(b => {
    const startTime = b.startTime ? new Date(b.startTime) : null;
    const expTime = b.expirationTime ? new Date(b.expirationTime) : null;
    if (startTime && startTime > now) return false;
    if (expTime && expTime < now) return false;
    return true;
  });

  // Sort by priority (high priority first)
  activeItems.sort((a, b) => b.priority - a.priority);
  res.json(activeItems);
});

// Admin list
app.get('/api/breaking/admin', requireRole(['Super Admin', 'Editor']), (req, res) => {
  res.json(db.read('breaking').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// Create breaking ticker
app.post('/api/breaking', requireRole(['Super Admin', 'Editor']), (req, res) => {
  const { text, priority = 1, startTime, expirationTime, active = true } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'సమాచారం ఖాళీగా ఉండకూడదు' });
  }
  const newItem = db.insert('breaking', {
    text,
    priority: Number(priority),
    startTime: startTime || null,
    expirationTime: expirationTime || null,
    active: !!active
  });
  res.status(201).json(newItem);
});

app.put('/api/breaking/:id', requireRole(['Super Admin', 'Editor']), (req, res) => {
  const id = Number(req.params.id);
  const { text, priority, startTime, expirationTime, active } = req.body;
  
  const updates = {};
  if (text !== undefined) updates.text = text;
  if (priority !== undefined) updates.priority = Number(priority);
  if (startTime !== undefined) updates.startTime = startTime;
  if (expirationTime !== undefined) updates.expirationTime = expirationTime;
  if (active !== undefined) updates.active = !!active;

  const updated = db.update('breaking', id, updates, req.user.name);
  if (!updated) return res.status(404).json({ error: 'సమాచారం లభించలేదు' });
  res.json(updated);
});

app.delete('/api/breaking/:id', requireRole(['Super Admin', 'Editor']), (req, res) => {
  const id = Number(req.params.id);
  const success = db.delete('breaking', id, req.user.name);
  if (!success) return res.status(404).json({ error: 'సమాచారం లభించలేదు' });
  res.json({ success: true });
});

// ================= E-PAPER PUBLISHER ENDPOINTS =================

app.get('/api/epaper', (req, res) => {
  const editions = db.read('epaper');
  editions.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(editions);
});

app.post('/api/epaper', requireRole(['Super Admin', 'Editor']), (req, res) => {
  const { date, pdfUrl, title } = req.body;
  if (!date || !pdfUrl || !title) {
    return res.status(400).json({ error: 'తేదీ, శీర్షిక మరియు పిడిఎఫ్ యు.ఆర్.ఎల్ అవసరం' });
  }

  const newItem = db.insert('epaper', { date, pdfUrl, title });
  res.status(201).json(newItem);
});

app.delete('/api/epaper/:id', requireRole(['Super Admin', 'Editor']), (req, res) => {
  const id = Number(req.params.id);
  const success = db.delete('epaper', id, req.user.name);
  if (!success) return res.status(404).json({ error: 'సంచిక లభించలేదు' });
  res.json({ success: true });
});

// ================= VIDEO PORTAL ENDPOINTS =================

app.get('/api/videos', (req, res) => {
  const videos = db.read('videos');
  videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(videos);
});

app.post('/api/videos', requireRole(['Super Admin', 'Editor']), (req, res) => {
  const { title, videoUrl, thumbnailUrl, category = 'Videos' } = req.body;
  if (!title || !videoUrl) {
    return res.status(400).json({ error: 'శీర్షిక మరియు వీడియో యు.ఆర్.ఎల్ అవసరం' });
  }
  const newItem = db.insert('videos', { title, videoUrl, thumbnailUrl, category });
  res.status(201).json(newItem);
});

app.delete('/api/videos/:id', requireRole(['Super Admin', 'Editor']), (req, res) => {
  const id = Number(req.params.id);
  const success = db.delete('videos', id, req.user.name);
  if (!success) return res.status(404).json({ error: 'వీడియో లభించలేదు' });
  res.json({ success: true });
});

// ================= PHOTO GALLERY ENDPOINTS =================

app.get('/api/galleries', (req, res) => {
  const list = db.read('galleries');
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

app.get('/api/galleries/:id', (req, res) => {
  const gallery = db.findOne('galleries', { id: Number(req.params.id) });
  if (!gallery) return res.status(404).json({ error: 'గ్యాలరీ లభించలేదు' });
  res.json(gallery);
});

app.post('/api/galleries', requireRole(['Super Admin', 'Editor']), (req, res) => {
  const { title, description, images = [], category = 'Photo Gallery' } = req.body;
  if (!title || images.length === 0) {
    return res.status(400).json({ error: 'శీర్షిక మరియు కనీసం ఒక చిత్రం అవసరం' });
  }
  const newItem = db.insert('galleries', { title, description, images, category });
  res.status(201).json(newItem);
});

app.delete('/api/galleries/:id', requireRole(['Super Admin', 'Editor']), (req, res) => {
  const id = Number(req.params.id);
  const success = db.delete('galleries', id, req.user.name);
  if (!success) return res.status(404).json({ error: 'గ్యాలరీ లభించలేదు' });
  res.json({ success: true });
});

// ================= ADVERTISEMENT CAMPAIGNS =================

// Public active advertisements
app.get('/api/ads', (req, res) => {
  const ads = db.read('ads').filter(ad => ad.active);
  const now = new Date();
  
  // Filter active advertisement run windows
  const activeAds = ads.filter(ad => {
    if (ad.startDate && new Date(ad.startDate) > now) return false;
    if (ad.endDate && new Date(ad.endDate) < now) return false;
    return true;
  });
  
  res.json(activeAds);
});

// Admin list
app.get('/api/ads/admin', requireRole(['Super Admin', 'Editor']), (req, res) => {
  res.json(db.read('ads').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.post('/api/ads', requireRole(['Super Admin', 'Editor']), (req, res) => {
  const { name, zone, imageUrl, targetUrl, startDate, endDate, active = true } = req.body;
  if (!name || !zone || !imageUrl) {
    return res.status(400).json({ error: 'పేరు, జోన్ మరియు ప్రకటన చిత్రం అవసరం' });
  }
  const newAd = db.insert('ads', {
    name, zone, imageUrl, targetUrl, startDate, endDate, active: !!active
  });
  res.status(201).json(newAd);
});

app.put('/api/ads/:id', requireRole(['Super Admin', 'Editor']), (req, res) => {
  const id = Number(req.params.id);
  const { name, zone, imageUrl, targetUrl, startDate, endDate, active } = req.body;
  
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (zone !== undefined) updates.zone = zone;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (targetUrl !== undefined) updates.targetUrl = targetUrl;
  if (startDate !== undefined) updates.startDate = startDate;
  if (endDate !== undefined) updates.endDate = endDate;
  if (active !== undefined) updates.active = !!active;

  const updated = db.update('ads', id, updates, req.user.name);
  if (!updated) return res.status(404).json({ error: 'ప్రకటన లభించలేదు' });
  res.json(updated);
});

app.delete('/api/ads/:id', requireRole(['Super Admin', 'Editor']), (req, res) => {
  const id = Number(req.params.id);
  const success = db.delete('ads', id, req.user.name);
  if (!success) return res.status(404).json({ error: 'ప్రకటన లభించలేదు' });
  res.json({ success: true });
});

// ================= LONG-TERM BACKUP ACTIONS =================

app.get('/api/backups', requireRole(['Super Admin']), (req, res) => {
  res.json(listBackups());
});

app.post('/api/backups', requireRole(['Super Admin']), (req, res) => {
  try {
    const result = createBackup();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/backups/verify', requireRole(['Super Admin']), (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'ఫైల్ పేరు అవసరం' });
  const verification = verifyBackup(filename);
  res.json(verification);
});

app.post('/api/backups/restore', requireRole(['Super Admin']), (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'ఫైల్ పేరు అవసరం' });
  try {
    const result = restoreBackup(filename);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= AUDIT LOGS FOR MONITORING =================

app.get('/api/admin/logs', requireRole(['Super Admin']), (req, res) => {
  res.json(db.read('audit_logs').sort((a, b) => b.id - a.id));
});

// Server Initialization
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` NAVA THARANGALU BACKEND RUNNING ON PORT ${PORT}`);
    console.log(`===============================================`);
  });
}

export default app;

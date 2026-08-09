import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.resolve('backend/data');

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to write file atomically
function atomicWriteFileSync(filePath, data) {
  const tempPath = filePath + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
}

const DB_CACHE = {};

const db = {
  // Read all records from a table
  read(table) {
    if (DB_CACHE[table]) {
      return DB_CACHE[table];
    }
    const filePath = path.join(DATA_DIR, `${table}.json`);
    if (!fs.existsSync(filePath)) {
      this.write(table, []);
      return [];
    }
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      DB_CACHE[table] = JSON.parse(content);
      return DB_CACHE[table];
    } catch (e) {
      console.error(`Database error reading table ${table}:`, e);
      return [];
    }
  },

  // Write all records to a table
  write(table, data) {
    DB_CACHE[table] = data;
    const filePath = path.join(DATA_DIR, `${table}.json`);
    atomicWriteFileSync(filePath, data);
  },

  // Find records matching key-value pairs
  find(table, query = {}) {
    const records = this.read(table);
    return records.filter(record => {
      for (const key in query) {
        if (record[key] !== query[key]) return false;
      }
      return true;
    });
  },

  // Find a single record by query
  findOne(table, query = {}) {
    const records = this.read(table);
    return records.find(record => {
      for (const key in query) {
        if (record[key] !== query[key]) return false;
      }
      return true;
    }) || null;
  },

  // Insert a record with auto-increment ID
  insert(table, record) {
    const records = this.read(table);
    const newRecord = {
      id: records.length > 0 ? Math.max(...records.map(r => r.id || 0)) + 1 : 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...record
    };
    records.push(newRecord);
    this.write(table, records);
    this.logActivity('INSERT', table, newRecord.id, record.author || 'system');
    return newRecord;
  },

  // Update a record by ID
  update(table, id, updates, author = 'system') {
    const records = this.read(table);
    const index = records.findIndex(r => r.id === Number(id));
    if (index === -1) return null;

    const updatedRecord = {
      ...records[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    records[index] = updatedRecord;
    this.write(table, records);
    this.logActivity('UPDATE', table, id, author);
    return updatedRecord;
  },

  // Delete a record by ID
  delete(table, id, author = 'system') {
    const records = this.read(table);
    const index = records.findIndex(r => r.id === Number(id));
    if (index === -1) return false;

    records.splice(index, 1);
    this.write(table, records);
    this.logActivity('DELETE', table, id, author);
    return true;
  },

  // Search articles using Telugu/English query matching
  searchArticles(queryStr, filters = {}) {
    let articles = this.read('articles').filter(a => a.status === 'Published');

    // Apply custom search keywords
    if (queryStr) {
      const term = queryStr.toLowerCase().trim();
      articles = articles.filter(a => 
        (a.title && a.title.toLowerCase().includes(term)) ||
        (a.content && a.content.toLowerCase().includes(term)) ||
        (a.description && a.description.toLowerCase().includes(term)) ||
        (a.tags && a.tags.some(t => t.toLowerCase().includes(term)))
      );
    }

    // Apply filters
    if (filters.category) {
      articles = articles.filter(a => a.category === filters.category);
    }
    if (filters.subcategory) {
      articles = articles.filter(a => a.subcategory === filters.subcategory);
    }
    if (filters.author) {
      articles = articles.filter(a => a.author === filters.author);
    }
    if (filters.year) {
      articles = articles.filter(a => new Date(a.publishedDate || a.createdAt).getFullYear() === Number(filters.year));
    }
    if (filters.month) {
      articles = articles.filter(a => new Date(a.publishedDate || a.createdAt).getMonth() === Number(filters.month) - 1);
    }

    // Sort: newest first
    return articles.sort((a, b) => new Date(b.publishedDate || b.createdAt) - new Date(a.publishedDate || a.createdAt));
  },

  // Logging system
  logActivity(action, table, recordId, user) {
    const logs = this.read('audit_logs');
    logs.push({
      id: logs.length + 1,
      timestamp: new Date().toISOString(),
      action,
      table,
      recordId,
      user
    });
    // Cap log history at 2000 items
    if (logs.length > 2000) logs.shift();
    this.write('audit_logs', logs);
  }
};

// Seed default users if users.json is empty or doesn't exist
const users = db.read('users');
if (users.length === 0) {
  // Passwords: admin123, editor123, reporter123
  // Hashed using SHA-256 for basic security in our demo database
  const hashPassword = (pwd) => crypto.createHash('sha256').update(pwd).digest('hex');

  db.insert('users', {
    username: 'admin',
    password: hashPassword('admin123'),
    name: 'Super Admin',
    role: 'Super Admin'
  });
  db.insert('users', {
    username: 'editor',
    password: hashPassword('editor123'),
    name: 'Editor In-Chief',
    role: 'Editor'
  });
  db.insert('users', {
    username: 'reporter',
    password: hashPassword('reporter123'),
    name: 'Reporter Amaravati',
    role: 'Reporter'
  });
  console.log('Seeded default user accounts.');
}

// Seed default news categories if categories.json is empty
const categories = db.read('categories');
if (categories.length === 0) {
  const seedCats = [
    { name: 'ఆంధ్రప్రదేశ్', slug: 'andhra-pradesh', parent: null },
    { name: 'తెలంగాణ', slug: 'telangana', parent: null },
    { name: 'జాతీయం', slug: 'national', parent: null },
    { name: 'అంతర్జాతీయం', slug: 'international', parent: null },
    { name: 'రాజకీయాలు', slug: 'politics', parent: null },
    { name: 'సినిమా', slug: 'cinema', parent: null },
    { name: 'క్రీడలు', slug: 'sports', parent: null },
    { name: 'వ్యాపారం', slug: 'business', parent: null },
    { name: 'టెక్నాలజీ', slug: 'technology', parent: null },
    { name: 'విద్య', slug: 'education', parent: null },
    { name: 'ఆరోగ్యం', slug: 'health', parent: null },
    { name: 'వ్యవసాయం', slug: 'agriculture', parent: null },
    { name: 'జీవనశైలి', slug: 'lifestyle', parent: null },
    { name: 'రాశిఫలాలు', slug: 'astrology', parent: null },
    
    // Subcategories / districts for Andhra Pradesh
    { name: 'అమరావతి', slug: 'amaravati', parent: 'andhra-pradesh' },
    { name: 'విశాఖపట్నం', slug: 'visakhapatnam', parent: 'andhra-pradesh' },
    { name: 'విజయవాడ', slug: 'vijayawada', parent: 'andhra-pradesh' },
    { name: 'తిరుపతి', slug: 'tirupati', parent: 'andhra-pradesh' },
    { name: 'గుంటూరు', slug: 'guntur', parent: 'andhra-pradesh' },
    
    // Subcategories / districts for Telangana
    { name: 'హైదరాబాద్', slug: 'hyderabad', parent: 'telangana' },
    { name: 'వరంగల్', slug: 'warangal', parent: 'telangana' },
    { name: 'కరీంనగర్', slug: 'karimnagar', parent: 'telangana' },
    { name: 'నిజామాబాద్', slug: 'nizamabad', parent: 'telangana' },
    { name: 'ఖమ్మం', slug: 'khammam', parent: 'telangana' }
  ];

  seedCats.forEach(c => db.insert('categories', c));
  console.log('Seeded default categories and districts.');
}

export default db;

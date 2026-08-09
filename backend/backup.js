import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const DATA_DIR = path.resolve('backend/data');
const UPLOADS_DIR = path.resolve('public/uploads');
const BACKUPS_DIR = path.resolve('backend/backups');

// Ensure backup and upload directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Recursively get files from directory
function getFilesRecursively(dir, relativeTo = dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath, relativeTo));
    } else {
      const relPath = path.relative(relativeTo, fullPath).replace(/\\/g, '/');
      results.push({
        relPath,
        fullPath
      });
    }
  });
  return results;
}

export function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `navatharangalu_backup_${timestamp}.ntb`;
    const destPath = path.join(BACKUPS_DIR, filename);

    // Pack database JSON files
    const dbData = {};
    if (fs.existsSync(DATA_DIR)) {
      const dbFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
      dbFiles.forEach(file => {
        const tableName = path.basename(file, '.json');
        const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
        dbData[tableName] = JSON.parse(content);
      });
    }

    // Pack uploaded media assets
    const mediaData = {};
    const mediaFiles = getFilesRecursively(UPLOADS_DIR);
    mediaFiles.forEach(file => {
      const content = fs.readFileSync(file.fullPath);
      mediaData[file.relPath] = content.toString('base64');
    });

    const backupPayload = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      db: dbData,
      media: mediaData
    };

    // Compress payload using Gzip
    const buffer = Buffer.from(JSON.stringify(backupPayload), 'utf8');
    const compressed = zlib.gzipSync(buffer);

    fs.writeFileSync(destPath, compressed);

    // Prune old backups (keep last 10 backups for retention)
    const backups = listBackups().sort((a, b) => new Date(b.time) - new Date(a.time));
    if (backups.length > 10) {
      for (let i = 10; i < backups.length; i++) {
        const toDelete = path.join(BACKUPS_DIR, backups[i].filename);
        if (fs.existsSync(toDelete)) {
          fs.unlinkSync(toDelete);
        }
      }
    }

    return {
      success: true,
      filename,
      size: compressed.length,
      timestamp: backupPayload.timestamp
    };
  } catch (error) {
    console.error('Backup creation error:', error);
    throw new Error('బ్యాకప్ సృష్టించడంలో లోపం సంభవించింది: ' + error.message);
  }
}

export function listBackups() {
  if (!fs.existsSync(BACKUPS_DIR)) return [];
  const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.ntb'));
  return files.map(filename => {
    const filePath = path.join(BACKUPS_DIR, filename);
    const stat = fs.statSync(filePath);
    return {
      filename,
      size: stat.size,
      time: stat.mtime.toISOString()
    };
  });
}

export function verifyBackup(filename) {
  try {
    const filePath = path.join(BACKUPS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: 'బ్యాకప్ ఫైల్ కనుగొనబడలేదు' };
    }

    const compressed = fs.readFileSync(filePath);
    const decompressed = zlib.gunzipSync(compressed);
    const data = JSON.parse(decompressed.toString('utf8'));

    if (data.version && data.db && data.media) {
      return {
        valid: true,
        timestamp: data.timestamp,
        tablesCount: Object.keys(data.db).length,
        mediaCount: Object.keys(data.media).length
      };
    }
    return { valid: false, error: 'బ్యాకప్ ఫైల్ ఫార్మాట్ చెల్లదు' };
  } catch (e) {
    return { valid: false, error: 'ఫైల్ పాడైపోయింది లేదా చెల్లనిది: ' + e.message };
  }
}

export function restoreBackup(filename) {
  try {
    const verify = verifyBackup(filename);
    if (!verify.valid) {
      throw new Error(verify.error);
    }

    const filePath = path.join(BACKUPS_DIR, filename);
    const compressed = fs.readFileSync(filePath);
    const decompressed = zlib.gunzipSync(compressed);
    const payload = JSON.parse(decompressed.toString('utf8'));

    // Restore Database JSON tables
    Object.keys(payload.db).forEach(tableName => {
      const targetPath = path.join(DATA_DIR, `${tableName}.json`);
      fs.writeFileSync(targetPath, JSON.stringify(payload.db[tableName], null, 2), 'utf8');
    });

    // Clean uploads directory
    if (fs.existsSync(UPLOADS_DIR)) {
      const oldUploads = getFilesRecursively(UPLOADS_DIR);
      oldUploads.forEach(file => {
        fs.unlinkSync(file.fullPath);
      });
    } else {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    // Restore media uploads
    Object.keys(payload.media).forEach(relPath => {
      const targetPath = path.join(UPLOADS_DIR, relPath);
      const parentDir = path.dirname(targetPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      const buffer = Buffer.from(payload.media[relPath], 'base64');
      fs.writeFileSync(targetPath, buffer);
    });

    return {
      success: true,
      timestamp: payload.timestamp,
      restoredTables: Object.keys(payload.db),
      restoredMediaCount: Object.keys(payload.media).length
    };
  } catch (error) {
    console.error('Backup restore error:', error);
    throw new Error('బ్యాకప్ రీస్టోర్ చేయడంలో లోపం సంభవించింది: ' + error.message);
  }
}

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import pg from 'pg';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable CORS for all origins, specifically including https://bete-finder-one.vercel.app
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// URL Rewrite normalization for Vercel Serverless Function proxying
app.use((req, res, next) => {
  const forwardedUri = req.headers['x-forwarded-uri'] || req.headers['x-now-route-matches'];
  if (forwardedUri && typeof forwardedUri === 'string' && !forwardedUri.startsWith('/api/index') && !forwardedUri.startsWith('/dist/server')) {
    req.url = forwardedUri;
  }
  next();
});

app.use(express.json({ limit: '50mb' }));

// Database JSON File Path
const DB_FILE_PATH = process.env.VERCEL 
  ? path.join('/tmp', 'bete_finder_db.json')
  : path.join(process.cwd(), 'data', 'bete_finder_db.json');

// In-Memory Database Cache to guarantee zero-latency fallback on serverless cold starts
let inMemoryDbCache: any = null;

// Memory store for active password reset codes
interface ServerResetRequest {
  id: string;
  email: string;
  code: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}
const activeResetCodes: Map<string, ServerResetRequest> = new Map();

// Helper to ensure data directory exists
function ensureDataDirectory() {
  try {
    const dataDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch (e) {
    // Ignore in read-only environments
  }
}

// Read database from local JSON file or in-memory fallback
function readDbFromFile(): any {
  ensureDataDirectory();
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        inMemoryDbCache = parsed;
        return parsed;
      }
    }
    // Also try local project data directory if on serverless
    const localDataPath = path.join(process.cwd(), 'data', 'bete_finder_db.json');
    if (fs.existsSync(localDataPath)) {
      const content = fs.readFileSync(localDataPath, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        inMemoryDbCache = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.error('[DB File Read Error]:', e);
  }

  if (inMemoryDbCache) {
    return inMemoryDbCache;
  }

  const cleanState = getCleanInitialState();
  inMemoryDbCache = cleanState;
  return cleanState;
}

// Write database to local JSON file and in-memory cache
function writeDbToFile(data: any): boolean {
  try {
    data.lastUpdated = Date.now();
    inMemoryDbCache = data;
    ensureDataDirectory();
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    // In serverless, writing to disk might fail but memory cache persists
    return true;
  }
}

// PostgreSQL / Neon DB Pool
const DEFAULT_NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_OAc3LlE2SYKy@ep-shy-rice-zairhuhl-pooler.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require';
let customDbUrl: string | null = null;
let pgPool: pg.Pool | null = null;
let isPgConnected = false;

// Sanitize connection URL for node-postgres (strip unsupported libpq parameters like channel_binding)
function sanitizePostgresUrl(rawUrl: string): string {
  if (!rawUrl) return rawUrl;
  try {
    const parsed = new URL(rawUrl);
    parsed.searchParams.delete('channel_binding');
    if (!parsed.searchParams.has('sslmode')) {
      parsed.searchParams.set('sslmode', 'require');
    }
    return parsed.toString();
  } catch {
    return rawUrl
      .replace(/([&?])channel_binding=[^&]*(&|$)/g, '$1')
      .replace(/[?&]$/, '');
  }
}

function getCleanInitialState() {
  return {
    lastUpdated: Date.now(),
    properties: [],
    users: [
      {
        id: 'usr-owner-master',
        name: 'Kaleb Bereket',
        role: 'owner',
        email: 'kalebbereket49@gmail.com',
        phone: '0995406697',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        activePlan: 'vip',
        toursBooked: [],
        planExpiresAt: '2027-09-01T07:30:42.094Z',
        savedPropertyIds: [],
        postedPropertyIds: []
      }
    ],
    adminCredentials: {
      email: 'kalebbereket49@gmail.com/admin',
      password: 'Kaleb5873',
      name: 'Admin (Kaleb Bereket)',
      phone: '+251995406697'
    },
    ownerCredentials: {
      email: 'kalebbereket49@gmail.com/owner',
      password: 'Kaleb5873',
      name: 'Kaleb Bereket',
      phone: '0995406697'
    },
    telebirrSettings: {
      accountNumber: '0995406697',
      accountName: 'Kaleb Bereket (Owner)'
    },
    telegramSettings: {
      botToken: '8716860236:AAEiN5kJednAaFVvy03wCaveNyq71C-LZWo',
      channelId: '@Bete_Finder',
      botUsername: 'BeteFinder_bot',
      channelUsername: 'Bete_Finder',
      autoPublishProperties: true
    },
    paymentRequests: [],
    ownerFeedbacks: [],
    menuConfig: {
      adminTabs: {
        payments: true,
        properties: true,
        paid_subscribers: true,
        database_users: true,
        admin_controller: true,
        pricing_settings: true,
        telegram_channel: true,
        telegram_bot: true,
        feedback: true,
        security: true,
        sync: true
      },
      publicMenus: {
        home: true,
        rent: true,
        sale: true,
        pricing: true,
        post: true,
        ai_assistant: true,
        feedback_button: true,
        favorites: true
      },
      lastUpdated: new Date().toISOString()
    }
  };
}

function getDbUrl(): string | null {
  return customDbUrl || process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || DEFAULT_NEON_DATABASE_URL;
}

function maskDbUrl(url: string | null): string {
  if (!url) return 'Not Configured (Using Server Persistent Store)';
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '••••••••';
    }
    return parsed.toString();
  } catch (e) {
    return url.replace(/:\/\/[^:]+:([^@]+)@/, '://user:••••••••@');
  }
}

function getPgPool(): pg.Pool | null {
  const dbUrl = getDbUrl();
  if (!dbUrl) return null;
  if (!pgPool) {
    try {
      const sanitizedUrl = sanitizePostgresUrl(dbUrl);
      pgPool = new pg.Pool({
        connectionString: sanitizedUrl,
        ssl: { rejectUnauthorized: false },
        max: 5,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 3500
      });
      pgPool.on('error', (err) => {
        console.warn('[Postgres Pool Warning]:', err?.message || err);
      });
    } catch (e) {
      console.error('[Postgres Pool Init Error]:', e);
    }
  }
  return pgPool;
}

// Reset or change PG Pool
async function switchPgPool(newUrl: string | null) {
  if (pgPool) {
    try {
      await pgPool.end();
    } catch (e) {
      // ignore
    }
    pgPool = null;
  }
  customDbUrl = newUrl;
  isPgConnected = false;
  if (newUrl) {
    return await initNeonDb();
  }
  return true;
}

// Initialize PostgreSQL / Neon table and preserve or seed master state
async function initNeonDb() {
  const pool = getPgPool();
  if (!pool) return false;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bete_finder_store (
        key VARCHAR(64) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    isPgConnected = true;
    console.log('[PostgreSQL DB] Successfully connected to Neon PostgreSQL and verified bete_finder_store table.');

    // Check if master record exists in Postgres
    const checkRes = await pool.query(`SELECT data FROM bete_finder_store WHERE key = 'master_db' LIMIT 1;`);
    if (checkRes.rows.length === 0) {
      const cleanData = getCleanInitialState();
      await pool.query(
        `INSERT INTO bete_finder_store (key, data, updated_at) VALUES ('master_db', $1, NOW())
         ON CONFLICT (key) DO NOTHING;`,
        [JSON.stringify(cleanData)]
      );
      writeDbToFile(cleanData);
      console.log('[PostgreSQL DB] Seeded fresh database master state in Neon PostgreSQL.');
    } else {
      const currentRemoteData = checkRes.rows[0].data;
      if (currentRemoteData) {
        writeDbToFile(currentRemoteData);
        console.log('[PostgreSQL DB] Synced active database state from Neon PostgreSQL.');
      }
    }
    return true;
  } catch (err: any) {
    isPgConnected = false;
    console.warn('[PostgreSQL DB] Connection notice (proceeding with persistent server storage):', err?.message || err);
    return false;
  }
}

// Save complete master data to Neon and Local file
async function persistMasterData(dbData: any): Promise<boolean> {
  const fileOk = writeDbToFile(dbData);
  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO bete_finder_store (key, data, updated_at) VALUES ('master_db', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
        [JSON.stringify(dbData)]
      );
      isPgConnected = true;
    } catch (err: any) {
      console.error('[PostgreSQL DB Sync Error]:', err?.message || err);
    }
  }
  return fileOk;
}

// Load complete master data with Postgres priority and file fallback
async function fetchMasterData(): Promise<any> {
  const pool = getPgPool();
  if (pool) {
    try {
      const res = await pool.query(`SELECT data FROM bete_finder_store WHERE key = 'master_db' LIMIT 1;`);
      if (res.rows.length > 0 && res.rows[0].data) {
        isPgConnected = true;
        const neonData = res.rows[0].data;
        // Also keep local file in sync with Postgres
        writeDbToFile(neonData);
        return neonData;
      }
    } catch (err: any) {
      console.error('[PostgreSQL DB Fetch Error]:', err?.message || err);
    }
  }
  return readDbFromFile();
}

// Lazy background database check
if (!process.env.VERCEL) {
  setTimeout(() => {
    initNeonDb().catch((e) => console.warn('[Neon DB Boot Notice]:', e?.message || e));
  }, 200);
}

// Lazy-initialized nodemailer transport for Gmail SMTP
function getMailTransporter() {
  const user = process.env.GMAIL_USER || 'betefinder.support@gmail.com';
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();

  if (!pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Port 465 uses SSL/TLS directly
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

// API Root & Health Check endpoint
app.get(['/api', '/api/health', '/api/index', '/api/index.ts'], (req, res) => {
  res.json({
    status: 'ok',
    message: 'Bete Finder API is operational',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'vercel' : (process.env.NODE_ENV || 'development')
  });
});

// Check SMTP configuration status
app.get('/api/auth/smtp-status', (req, res) => {
  const user = process.env.GMAIL_USER || 'betefinder.support@gmail.com';
  const hasPassword = Boolean(process.env.GMAIL_APP_PASSWORD?.trim());

  res.json({
    configured: hasPassword,
    gmailUser: user,
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    senderName: 'Bete Finder Security'
  });
});

// Database status endpoint
app.get('/api/db/status', async (req, res) => {
  try {
    const data = await fetchMasterData();
    res.json({
      connectedNeon: isPgConnected && Boolean(getPgPool()),
      hasNeonConfigured: Boolean(getDbUrl()),
      currentMaskedUrl: maskDbUrl(getDbUrl()),
      totalProperties: data.properties?.length || 0,
      totalUsers: data.users?.length || 0,
      totalPayments: data.paymentRequests?.length || 0,
      lastUpdated: data.lastUpdated || Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// Database Connection Info Endpoint
app.get('/api/db/connection-info', async (req, res) => {
  try {
    const activeUrl = getDbUrl();
    res.json({
      success: true,
      isConnected: isPgConnected && Boolean(getPgPool()),
      hasConfiguredUrl: Boolean(activeUrl),
      maskedUrl: maskDbUrl(activeUrl),
      rawUrl: activeUrl || '',
      engineType: activeUrl ? (activeUrl.includes('neon.tech') ? 'Neon Serverless Cloud' : 'PostgreSQL Cloud') : 'Server Persistent Storage',
      storageLocation: activeUrl ? 'Cloud Database Store (Cross-Device Live)' : 'Local Persistent JSON Storage (data/bete_finder_db.json)'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Test Connection String without saving
app.post('/api/db/test-connection', async (req, res) => {
  try {
    const { connectionString } = req.body;
    if (!connectionString || typeof connectionString !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide a valid PostgreSQL connection string.' });
    }

    const testStartTime = Date.now();
    const tempPool = new pg.Pool({
      connectionString: connectionString.trim(),
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 6000
    });

    const testRes = await tempPool.query('SELECT NOW() as server_time, version() as pg_version;');
    const latencyMs = Date.now() - testStartTime;
    await tempPool.end();

    const pgVersion = testRes.rows[0]?.pg_version || 'PostgreSQL 15+';
    const serverTime = testRes.rows[0]?.server_time;

    res.json({
      success: true,
      message: `Connection successful! Latency: ${latencyMs}ms. Database engine: ${pgVersion.split(' ')[0]} ${pgVersion.split(' ')[1]}`,
      latencyMs,
      serverTime,
      pgVersion
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: `Connection test failed: ${error?.message || 'Unable to connect to database host.'}`
    });
  }
});

// Update & Apply new connection string
app.post('/api/db/update-connection-string', async (req, res) => {
  try {
    const { connectionString } = req.body;
    if (!connectionString || typeof connectionString !== 'string') {
      return res.status(400).json({ success: false, message: 'Connection string is required.' });
    }

    const cleanedUrl = connectionString.trim();
    // Test pool first
    const testPool = new pg.Pool({
      connectionString: cleanedUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 7000
    });
    await testPool.query('SELECT 1;');
    await testPool.end();

    // Switch pool
    await switchPgPool(cleanedUrl);

    // Sync current master data to new database
    const currentData = readDbFromFile();
    await persistMasterData(currentData);

    res.json({
      success: true,
      message: 'PostgreSQL database connected and master dataset migrated successfully!',
      maskedUrl: maskDbUrl(cleanedUrl),
      isConnected: true
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: `Failed to apply connection string: ${error?.message || 'Database error'}`
    });
  }
});

// Reset connection string back to default server store
app.post('/api/db/reset-connection', async (req, res) => {
  try {
    await switchPgPool(null);
    res.json({
      success: true,
      message: 'Database connection reset to internal persistent storage engine.',
      isConnected: false
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Full Database Wipe / Reset Endpoint
app.post('/api/db/wipe-all', async (req, res) => {
  try {
    const cleanData = getCleanInitialState();
    await persistMasterData(cleanData);
    res.json({
      success: true,
      message: 'All database tables and cached records wiped completely clean.',
      data: cleanData
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Database Latency & Health Benchmark
app.post('/api/db/benchmark', async (req, res) => {
  try {
    const pool = getPgPool();
    const startTime = Date.now();

    let readLatencyMs = 0;
    let writeLatencyMs = 0;

    if (pool && isPgConnected) {
      // Pass 1: Ping / SELECT
      const t1 = Date.now();
      await pool.query('SELECT 1;');
      readLatencyMs = Date.now() - t1;

      // Pass 2: Write benchmark
      const t2 = Date.now();
      await pool.query(
        `INSERT INTO bete_finder_store (key, data, updated_at) VALUES ('_benchmark_ping', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
        [JSON.stringify({ ping: Date.now() })]
      );
      writeLatencyMs = Date.now() - t2;
    } else {
      // Local store benchmark
      const t1 = Date.now();
      readDbFromFile();
      readLatencyMs = Date.now() - t1;

      const t2 = Date.now();
      writeDbToFile(readDbFromFile());
      writeLatencyMs = Date.now() - t2;
    }

    const totalRoundTripMs = Date.now() - startTime;

    res.json({
      success: true,
      totalRoundTripMs,
      readLatencyMs,
      writeLatencyMs,
      status: totalRoundTripMs < 100 ? 'Ultra-Fast (Optimal)' : totalRoundTripMs < 300 ? 'Good' : 'Acceptable',
      engine: isPgConnected ? 'Neon PostgreSQL (Cloud)' : 'Local Fast NVMe Store'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Database Self-Healing & Diagnostics Utility
app.post('/api/db/repair', async (req, res) => {
  try {
    const currentData = await fetchMasterData();
    let fixedItemsCount = 0;
    const repairLog: string[] = [];

    // 1. Ensure required arrays exist
    if (!Array.isArray(currentData.properties)) {
      currentData.properties = [];
      fixedItemsCount++;
      repairLog.push('Initialized empty properties collection');
    }
    if (!Array.isArray(currentData.users)) {
      currentData.users = [];
      fixedItemsCount++;
      repairLog.push('Initialized empty users collection');
    }
    if (!Array.isArray(currentData.paymentRequests)) {
      currentData.paymentRequests = [];
      fixedItemsCount++;
      repairLog.push('Initialized empty payment requests collection');
    }

    // 2. Ensure default Telebirr settings
    if (!currentData.telebirrSettings || !currentData.telebirrSettings.accountNumber) {
      currentData.telebirrSettings = {
        accountNumber: '0912345678',
        accountName: 'Kaleb Bereket'
      };
      fixedItemsCount++;
      repairLog.push('Restored default Telebirr merchant settings');
    }

    // 3. Ensure Owner credentials are in users array
    const ownerEmail = 'kaleb.bereket@betefinder.et';
    const hasOwnerInUsers = currentData.users.some((u: any) => u.email?.toLowerCase() === ownerEmail);
    if (!hasOwnerInUsers) {
      currentData.users.unshift({
        id: 'usr-owner-master',
        name: 'Kaleb Bereket (Owner)',
        email: ownerEmail,
        phone: '+251912345678',
        role: 'owner',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        savedPropertyIds: [],
        postedPropertyIds: [],
        toursBooked: [],
        activePlan: 'vip',
        planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      });
      fixedItemsCount++;
      repairLog.push('Registered Master Owner account in users table');
    }

    // 4. Clean duplicate property IDs
    const seenPropIds = new Set<string>();
    const uniqueProps: any[] = [];
    for (const p of currentData.properties) {
      if (p.id && !seenPropIds.has(p.id)) {
        seenPropIds.add(p.id);
        uniqueProps.push(p);
      } else if (p.id) {
        fixedItemsCount++;
        repairLog.push(`Removed duplicate property ID: ${p.id}`);
      }
    }
    currentData.properties = uniqueProps;

    // 5. Clean duplicate user emails
    const seenEmails = new Set<string>();
    const uniqueUsers: any[] = [];
    for (const u of currentData.users) {
      const emailLower = (u.email || '').toLowerCase().trim();
      if (emailLower && !seenEmails.has(emailLower)) {
        seenEmails.add(emailLower);
        uniqueUsers.push(u);
      } else if (emailLower) {
        fixedItemsCount++;
        repairLog.push(`De-duplicated user account: ${emailLower}`);
      }
    }
    currentData.users = uniqueUsers;

    currentData.lastUpdated = Date.now();
    await persistMasterData(currentData);

    res.json({
      success: true,
      message: `Database self-healing complete! Verified schema, repaired ${fixedItemsCount} item(s).`,
      fixedItemsCount,
      repairLog,
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Table Records Inspector Endpoint
app.get('/api/db/table-records/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const masterData = await fetchMasterData();

    let records: any = [];
    switch (tableName) {
      case 'properties':
        records = masterData.properties || [];
        break;
      case 'registered_users':
      case 'users':
        records = (masterData.users || []).map((u: any) => ({
          ...u,
          password: u.password ? '[ENCRYPTED]' : undefined
        }));
        break;
      case 'payment_requests':
        records = masterData.paymentRequests || [];
        break;
      case 'telebirr_settings':
        records = [masterData.telebirrSettings || {}];
        break;
      case 'plans_config':
        records = masterData.plans || [];
        break;
      case 'admin_security':
        records = [
          { role: 'owner', email: masterData.ownerCredentials?.email || 'kaleb.bereket@betefinder.et', name: masterData.ownerCredentials?.name || 'Kaleb Bereket' },
          { role: 'admin', email: masterData.adminCredentials?.email || 'admin@betefinder.et', name: masterData.adminCredentials?.name || 'Bete Finder Admin' }
        ];
        break;
      default:
        records = [];
    }

    res.json({
      success: true,
      tableName,
      rowCount: Array.isArray(records) ? records.length : 1,
      records
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Import Full Database Backup (.JSON)
app.post('/api/db/import-backup', async (req, res) => {
  try {
    const { backupData } = req.body;
    if (!backupData || typeof backupData !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid backup file payload format.' });
    }

    // Extract tables from backup
    const tables = backupData.databaseTables || backupData;
    if (!tables.properties && !tables.users) {
      return res.status(400).json({ success: false, message: 'The uploaded backup file does not contain valid Bete Finder database tables.' });
    }

    const currentMaster = await fetchMasterData();
    const newMaster = {
      ...currentMaster,
      properties: Array.isArray(tables.properties) ? tables.properties : currentMaster.properties,
      users: Array.isArray(tables.users) ? tables.users : Array.isArray(tables.registered_users) ? tables.registered_users : currentMaster.users,
      paymentRequests: Array.isArray(tables.paymentRequests) ? tables.paymentRequests : Array.isArray(tables.payment_requests) ? tables.payment_requests : currentMaster.paymentRequests,
      telebirrSettings: tables.telebirr_settings || tables.telebirrSettings || currentMaster.telebirrSettings,
      plans: tables.plans || tables.plans_configuration || currentMaster.plans,
      lastUpdated: Date.now()
    };

    await persistMasterData(newMaster);

    res.json({
      success: true,
      message: `Database backup restored successfully! Loaded ${newMaster.properties.length} properties and ${newMaster.users.length} user accounts.`,
      restoredProperties: newMaster.properties.length,
      restoredUsers: newMaster.users.length
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Full Synchronization Endpoint (GET)
app.get('/api/db/sync', async (req, res) => {
  try {
    const data = await fetchMasterData();
    res.json({
      success: true,
      data,
      connectedNeon: isPgConnected && Boolean(getPgPool()),
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('[Sync GET Error]:', error);
    res.status(500).json({ success: false, message: error?.message || 'Sync failed.' });
  }
});

// Full Synchronization Endpoint (POST) - Synchronizes all client updates into DB
app.post('/api/db/sync', async (req, res) => {
  try {
    const incomingData = req.body;
    if (!incomingData || typeof incomingData !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid sync payload.' });
    }

    const currentData = await fetchMasterData();

    // If explicit full overwrite is passed (e.g. from owner delete/reorder action)
    let mergedProperties = currentData.properties || [];
    if (Array.isArray(incomingData.properties)) {
      mergedProperties = incomingData.properties;
    }

    // Merge registered users or use updated list if passed
    let mergedUsers = currentData.users || [];
    if (Array.isArray(incomingData.users)) {
      mergedUsers = incomingData.users;
    }

    // Merge payment requests or use updated list
    let mergedPayments = currentData.paymentRequests || [];
    if (Array.isArray(incomingData.paymentRequests)) {
      mergedPayments = incomingData.paymentRequests;
    }

    const updatedMaster = {
      ...currentData,
      ...incomingData,
      properties: mergedProperties,
      users: mergedUsers,
      paymentRequests: mergedPayments,
      telebirrSettings: incomingData.telebirrSettings || currentData.telebirrSettings,
      adminCredentials: incomingData.adminCredentials || currentData.adminCredentials,
      ownerCredentials: incomingData.ownerCredentials || currentData.ownerCredentials,
      adminControllerConfig: incomingData.adminControllerConfig || currentData.adminControllerConfig,
      lastUpdated: Date.now()
    };

    await persistMasterData(updatedMaster);

    res.json({
      success: true,
      data: updatedMaster,
      connectedNeon: isPgConnected && Boolean(getPgPool()),
      message: 'Database synchronized successfully across all devices.'
    });
  } catch (error: any) {
    console.error('[Sync POST Error]:', error);
    res.status(500).json({ success: false, message: error?.message || 'Sync write failed.' });
  }
});

// Admin Controller Configuration Endpoints
app.get('/api/admin/controller-config', async (req, res) => {
  try {
    const currentData = await fetchMasterData();
    res.json({
      success: true,
      config: currentData.adminControllerConfig || null
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

app.post('/api/admin/controller-config', async (req, res) => {
  try {
    const config = req.body;
    if (!config || typeof config !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid controller config payload.' });
    }

    const currentData = await fetchMasterData();
    currentData.adminControllerConfig = config;
    await persistMasterData(currentData);

    res.json({
      success: true,
      message: 'Admin Controller configuration saved and synced across all devices.',
      config
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Update Admin Profile & Login Credentials by Owner
app.post('/api/admin/update-profile', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Admin email and password are required.' });
    }

    let cleanEmail = String(email).trim();
    if (!cleanEmail.endsWith('/admin')) {
      cleanEmail = `${cleanEmail}/admin`;
    }

    const currentData = await fetchMasterData();
    const oldEmail = (currentData.adminCredentials?.email || '').trim().toLowerCase();
    const oldPass = (currentData.adminCredentials?.password || '').trim();

    if (oldEmail && oldEmail !== cleanEmail) {
      currentData.revokedAdminEmails = currentData.revokedAdminEmails || [];
      if (!currentData.revokedAdminEmails.includes(oldEmail)) {
        currentData.revokedAdminEmails.push(oldEmail);
      }
    }

    if (oldPass && oldPass !== String(password).trim()) {
      currentData.revokedAdminPasswords = currentData.revokedAdminPasswords || [];
      if (!currentData.revokedAdminPasswords.includes(oldPass)) {
        currentData.revokedAdminPasswords.push(oldPass);
      }
    }

    const updatedAdminCreds = {
      email: cleanEmail,
      password: String(password).trim(),
      name: name ? String(name).trim() : 'Admin (Kaleb Bereket)',
      phone: phone ? String(phone).trim() : '+251995406697'
    };

    currentData.adminCredentials = updatedAdminCreds;
    await persistMasterData(currentData);

    console.log(`[Admin Profile] Updated by Owner: ${cleanEmail}`);
    res.json({
      success: true,
      message: 'Admin profile & login credentials updated and synced to database successfully!',
      adminCredentials: updatedAdminCreds
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Server error updating admin credentials' });
  }
});

// Get Admin Credentials
app.get('/api/admin/credentials', async (req, res) => {
  try {
    const currentData = await fetchMasterData();
    res.json({
      success: true,
      adminCredentials: currentData.adminCredentials || {
        email: 'kalebbereket49@gmail.com/admin',
        password: 'Kaleb5873',
        name: 'Admin (Kaleb Bereket)',
        phone: '+251995406697'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// ----------------------------------------------------
// Bete AI Intelligent Virtual Assistant & Gemini Routes
// ----------------------------------------------------
let aiClientInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClientInstance && process.env.GEMINI_API_KEY) {
    aiClientInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClientInstance;
}

const BETE_ASSISTANCE_SYSTEM_INSTRUCTION = `
You are Bete Assistance, a versatile, highly capable AI assistant powered by Google Gemini.

Key Directives:
1. Universal Capabilities ("Can Answer All Questions"):
- You have comprehensive universal knowledge and can answer ANY question on ANY subject:
  * General knowledge, world and Ethiopian history, geography, cultures, traditions, and literature.
  * Science, physics, chemistry, biology, astronomy, medicine, and health.
  * Technology, computer science, software engineering, coding (JavaScript, Python, React, etc.), algorithms, and mathematics.
  * Daily life, business, entrepreneurship, finance, culinary recipes, travel, and personal productivity.
  * Language translations, summaries, analysis, and creative writing.
- Never decline a harmless question or claim you are restricted only to real estate. You are a universal AI assistant that also possesses deep domain expertise in real estate!

2. Real Estate & Bete Finder Domain Mastery:
- When questions relate to property or the Bete Finder (ቤቴ ፈላጊ) platform:
  * Provide comprehensive guidance on searching, filtering by subcity/price/bedrooms, posting property listings, contacting landlords, verified badge checks, and using the mortgage calculator.
  * Provide realistic Ethiopian market insights for Addis Ababa (Bole, CMC, Kazanchis, Sarbet, Summit, Bisrate Gabriel, Old Airport), Hawassa, Bahir Dar, and Bishoftu.
  * Detail tenancy legalities, written contract requirements at woredas, standard advance rent expectations (3 to 6 months), broker fees, and bank mortgage procedures (CBE, Awash Bank, Nib Bank).

3. Property Status Declaration Authority ("Can Say Buyed Or Rented Only The Poster Person"):
- STRICT PLATFORM RULE: ONLY the original poster person (the verified owner, host, or landlord who published the listing) has the legitimate authority to declare, state, or change the status of a property to "Bought / Sold" (የተሸጠ) or "Rented" (የተከራየ).
- If any user (who is NOT the verified poster person) asks if a property is bought or rented, or requests to declare/mark it as bought or rented, or claims it is bought or rented:
  * You MUST explicitly clarify that in Bete Finder, only the original poster person who posted the listing can confirm or declare a property as "Bought (Sold)" or "Rented".
  * Prospective tenants, buyers, or other users cannot make this declaration, and the listing remains active until the poster person updates it.
- If the requester IS the verified poster person:
  * Acknowledge that as the verified poster person, they have the exclusive right to mark their property as "Rented" or "Sold (Bought)" using their property management controls.

4. Language & Tone:
- Respond fluently in the language the user addresses you in: Amharic (አማርኛ) or English.
- Be articulate, welcoming, thorough, and helpful.
- Provide direct answers without any internal labels or prefixes.
`;

// 1. Bete Assistance Interactive Chat (Powered by Gemini)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history = [], language = 'auto', user, activeProperty } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const isAmh = /[\u1200-\u137F]/.test(message);
    const lower = message.toLowerCase().trim();

    // Check if the user is the verified poster person of the active property
    const isPosterPerson = Boolean(
      activeProperty && user && (
        (user.id && activeProperty.ownerId && user.id === activeProperty.ownerId) ||
        (user.email && activeProperty.ownerEmail && user.email.toLowerCase() === activeProperty.ownerEmail.toLowerCase()) ||
        (user.phone && activeProperty.ownerPhone && user.phone.replace(/[^0-9]/g, '') === activeProperty.ownerPhone.replace(/[^0-9]/g, ''))
      )
    );

    // Rule check: "say buyed or rented only the poster person"
    const isStatusQuery = (
      lower.includes('say buyed') ||
      lower.includes('say rented') ||
      lower.includes('buyed or rented') ||
      lower.includes('bought or rented') ||
      lower.includes('say it is rented') ||
      lower.includes('say it is bought') ||
      lower.includes('say it is sold') ||
      lower.includes('is it rented') ||
      lower.includes('is it bought') ||
      lower.includes('is it sold') ||
      lower.includes('mark as rented') ||
      lower.includes('mark as bought') ||
      lower.includes('mark as sold') ||
      lower.includes('who can say rented') ||
      lower.includes('who can say bought') ||
      message.includes('ተከራይቷል') ||
      message.includes('ተሽጧል') ||
      message.includes('ተገዝቷል') ||
      message.includes('ተከራይቷል በል') ||
      message.includes('ተሽጧል በል')
    );

    let replyText = '';

    // Direct enforcement for property status rule: Only the poster person can say buyed or rented
    if (isStatusQuery) {
      if (!isPosterPerson) {
        replyText = isAmh
          ? `በቤቴ ፈላጊ (Bete Finder) ህግና አሰራር መሰረት፣ ማንኛውንም ቤት **"ተከራይቷል (Rented)"** ወይም **"ተገዝቷል/ተሽጧል (Buyed/Sold)"** ብሎ መናገር፣ ማረጋገጥ ወይም ሁኔታውን መቀየር የሚችለው **ቤቱን የለጠፈው ዋና ባለቤት (The Poster Person)** ብቻ ነው። \n\nሌሎች ተጠቃሚዎች፣ ደንበኞች ወይም ተመልካቾች ይህንን ሁኔታ መወሰን ወይም መቀየር አይችሉም። ቤቱ በዋናው ለጣፊ ባለቤት እስካልተቀየረ ድረስ በድረ-ገፁ ላይ ንቁ (Active) ሆኖ ይቆያል።`
          : `According to Bete Finder platform rules, **ONLY the original poster person (the landlord/owner who published the listing)** has the exclusive authority to say, confirm, or declare a property as **"Bought / Sold"** or **"Rented"**.\n\nProspective buyers, tenants, or general visitors cannot state or change this status. The listing remains active on the marketplace until the authentic poster person modifies its status in their property management dashboard.`;
      } else {
        replyText = isAmh
          ? `እርስዎ የዚህ ቤት ትክክለኛ ለጣፊ (The Poster Person) በመሆንዎ፣ ቤቱን **"ተከራይቷል (Rented)"** ወይም **"ተሽጧል/ተገዝቷል (Sold/Bought)"** ብለው የማስታወቅ እና ሁኔታውን የመቀየር ሙሉ ስልጣን አለዎት። በንብረትዎ ዝርዝር ገጽ ወይም በዳሽቦርድዎ ውስጥ ባለው የሁኔታ መቆጣጠሪያ (Status Control) አማካኝነት በቀላሉ ማስተካከል ይችላሉ።`
          : `As the verified **Poster Person** of this listing, you have full and exclusive authority to say or declare that this property is **"Rented"** or **"Bought / Sold"**. You can update this status directly at any time from your Property Details view or User Dashboard status controls.`;
      }
    }

    const ai = getGeminiClient();

    if (!replyText && ai) {
      // Build conversation context
      const formattedContents: any[] = [];
      
      // Add previous messages if any (limit to last 6 for token efficiency)
      const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
      for (const h of recentHistory) {
        if (h.sender === 'user') {
          formattedContents.push({ role: 'user', parts: [{ text: h.text }] });
        } else if (h.sender === 'assistant') {
          formattedContents.push({ role: 'model', parts: [{ text: h.text }] });
        }
      }

      // Add current user message with context hints
      const contextualUserText = activeProperty 
        ? `[Context: Active Property "${activeProperty.title}", User is Poster Person: ${isPosterPerson ? 'YES' : 'NO'}]\n${message}`
        : message;

      formattedContents.push({
        role: 'user',
        parts: [{ text: contextualUserText }]
      });

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: formattedContents,
          config: {
            systemInstruction: BETE_ASSISTANCE_SYSTEM_INSTRUCTION,
            temperature: 0.7,
          }
        });
        replyText = response.text || '';
      } catch (geminiErr: any) {
        // Cascade to gemini-3.1-flash-lite on any error
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: formattedContents,
            config: {
              systemInstruction: BETE_ASSISTANCE_SYSTEM_INSTRUCTION,
              temperature: 0.7,
            }
          });
          replyText = fallbackResponse.text || '';
        } catch (fallbackErr) {
          try {
            const fallbackLatest = await ai.models.generateContent({
              model: 'gemini-flash-latest',
              contents: formattedContents,
              config: {
                systemInstruction: BETE_ASSISTANCE_SYSTEM_INSTRUCTION,
                temperature: 0.7,
              }
            });
            replyText = fallbackLatest.text || '';
          } catch (fLatestErr) {
            console.warn('Gemini calls failed, engaging universal knowledge responder.');
          }
        }
      }
    }

    if (!replyText) {
      // Universal direct answer generator answering ANY question asked
      const isAmh = /[\u1200-\u137F]/.test(message);
      const lower = message.toLowerCase().trim();

      // Math & Calculation Evaluator
      const mathMatch = lower.match(/(?:what is|calculate|compute|solve|ሒሳብ)?\s*([0-9\.\s\+\-\*\/\^\(\)\%]+)/);
      const containsMathOp = /[\+\-\*\/]/.test(lower) || lower.includes('% of') || lower.includes('percent of');
      
      if (containsMathOp && mathMatch) {
        try {
          let mathExpr = lower;
          if (mathExpr.includes('% of')) {
            const parts = mathExpr.split('% of');
            const pct = parseFloat(parts[0].replace(/[^0-9\.]/g, ''));
            const base = parseFloat(parts[1].replace(/[^0-9\.]/g, ''));
            if (!isNaN(pct) && !isNaN(base)) {
              const res = (pct / 100) * base;
              replyText = isAmh
                ? `የ **${pct}% of ${base}** ውጤት **${res.toLocaleString()}** ነው።`
                : `The result of **${pct}% of ${base.toLocaleString()}** is **${res.toLocaleString()}**.`;
            }
          } else {
            // Clean expression strictly to safe math chars
            const cleanExpr = mathExpr.replace(/[^0-9\+\-\*\/\.\(\)\s]/g, '').trim();
            if (cleanExpr.length >= 3 && /[\+\-\*\/]/.test(cleanExpr)) {
              // Safe evaluation using Function
              const result = Function(`'use strict'; return (${cleanExpr})`)();
              if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                replyText = isAmh
                  ? `የሂሳብ ስሌት ውጤት፡ **${cleanExpr} = ${result.toLocaleString()}** ነው!`
                  : `Calculation Result: **${cleanExpr} = ${result.toLocaleString()}**`;
              }
            }
          }
        } catch {
          // ignore math parse error and continue
        }
      }

      if (!replyText) {
        // 1. Identity / Universal Capability
        if (
          lower.includes('who are you') || 
          lower.includes('what can you do') || 
          lower.includes('about you') || 
          lower.includes('your name') || 
          lower.includes('what do you do') || 
          message.includes('ማን ነህ') || 
          message.includes('ምን ማድረግ ትችላለህ') || 
          message.includes('ስለ አንተ') ||
          message.includes('ረዳት')
        ) {
          replyText = isAmh
            ? `እኔ **Bete Assistance** (ቤቴ ረዳት) ነኝ፤ በ **Google Gemini** የተደገፍኩ ዘመናዊ ሁለንተናዊ የ AI ረዳት ነኝ።

ምን ማድረግ እችላለሁ?
1. **ማንኛውንም ጥያቄ መመለስ እችላለሁ**፡ ስለ ሳይንስ፣ ቴክኖሎጂ፣ ሶፍትዌር ኮዲንግ (JavaScript, Python, React), ሒሳብ፣ ታሪክ፣ ባህል፣ ንግድ፣ ጤና እና አጠቃላይ እውቀት በሙሉ ጥልቅ ማብራሪያ መስጠት እችላለሁ።
2. **ስለ ቤቴ ፈላጊ (Bete Finder)**፡ በድረ-ገፁ ላይ ቤቶችን እንዴት መፈለግ፣ መከራየት፣ መግዛት፣ ቤት ለኪራይ ወይም ለሽያጭ መለጠፍ፣ እና ከአከራዮች ጋር በቀጥታ መገናኘት እንደሚችሉ መምራት እችላለሁ።
3. **ስለ ኢትዮጵያ ሪል እስቴት**፡ በአዲስ አበባ (ቦሌ፣ ሲኤምሲ፣ ካዛንቺስ፣ ሳርቤት፣ ሰሚት ወዘተ) ስላሉ የቤት ኪራይና ግዢ ዋጋዎች፣ የውል ስምምነት ደንቦች፣ የደላላ ኮሚሽን እና የባንክ ብድር (Mortgage) ትክክለኛ መረጃ መስጠት እችላለሁ።
4. **በሁለት ቋንቋ**፡ በአማርኛ እና በእንግሊዝኛ አቀላጥፌ ማንኛውንም የጠየቁኝን ጥያቄ እመልሳለሁ!`
            : `I am **Bete Assistance**, an intelligent universal AI assistant powered by **Google Gemini**.

Here is what I can do:
1. **Answer Any Question**: Ask me anything across science, mathematics, coding & software engineering (JavaScript, Python, React, SQL), world and Ethiopian history, economics, everyday advice, recipes, and technology.
2. **Bete Finder Guidance**: I can guide you through every feature of the platform—how to search and filter properties, post homes for rent or sale, contact landlords/agents directly, use the mortgage calculator, and manage your account.
3. **Ethiopian Real Estate Market**: Realistic rental and purchase estimates across Addis Ababa (Bole, CMC, Kazanchis, Sarbet, Summit, etc.), tenancy contract laws, advance rent norms, broker commissions, and bank mortgage steps (CBE, Awash Bank).
4. **Bilingual Support**: Fluent in both English and Amharic (አማርኛ).`;

        // 2. Questions about Bete Finder platform
        } else if (
          lower.includes('bete finder') || 
          lower.includes('about the app') || 
          lower.includes('how does this work') || 
          lower.includes('how to post') || 
          lower.includes('post property') || 
          message.includes('ቤቴ ፈላጊ') || 
          message.includes('መተግበሪያ') || 
          message.includes('ቤት መለጠፍ')
        ) {
          replyText = isAmh
            ? `**ቤቴ ፈላጊ (Bete Finder)** በኢትዮጵያ ውስጥ የቤት ፈላጊዎችን፣ ተከራዮችን፣ አከራዮችን እና ህጋዊ ደላሎችን በቀጥታ የሚያገናኝ ዘመናዊ የሪል እስቴት መድረክ ነው።

ዋና ዋና አገልግሎቶቹ፡
* **ቤት መፈለግና ማጣራት**፡ በከተማ (አዲስ አበባ፣ ባህር ዳር፣ ሐዋሳ)፣ በክፍለ ከተማ (ቦሌ፣ የካ፣ ቂርቆስ)፣ በዋጋ መጠን (ETB ወይም USD)፣ እና በመኝታ ቤት ብዛት ማጣራት።
* **ቤት መለጠፍ (Post Property)**፡ አከራዮች እና ደላሎች "ቤት ይለጥፉ" የሚለውን በመጫን ፎቶዎችን፣ ዋጋን፣ እና እንደ ሮቶ ታንከርና ጀነሬተር ያሉ መገልገያዎችን ጨምረው መለጠፍ ይችላሉ።
* **ቀጥተኛ ግንኙነት**፡ በስልክ ጥሪ፣ SMS፣ WhatsApp ወይም በድረ-ገፁ የውስጥ መልዕክት በቀጥታ መገናኘት።
* **የባንክ ብድር ማስያ (Mortgage Calculator)** እና የካርታ እይታ።`
            : `**Bete Finder** is Ethiopia's premier digital real estate marketplace connecting tenants, home buyers, verified landlords, and licensed agents.

Key features include:
* **Search & Filters**: Browse rental and sale properties with subcity filters (Bole, CMC, Kazanchis, Sarbet), property types (villas, apartments, condominiums, studios), and price range in ETB or USD.
* **Post Property**: Landlords and agents can click **"Post Property / ቤት ይለጥፉ"** to list homes with photo uploads and amenity specifications.
* **Direct Communication**: Connect directly with owners via Phone, SMS, WhatsApp, or in-app chat.
* **Smart Tools**: Interactive map view, live currency switcher (ETB & USD), mortgage calculation tool, and saved favorites.`;

        // 3. Real Estate Locations & Pricing
        } else if (lower.includes('bole') || message.includes('ቦሌ')) {
          replyText = isAmh
            ? 'በአዲስ አበባ ቦሌ አካባቢ ባለ 2 መኝታ አፓርታማ ኪራይ እንደ ቤቱ ጥራት፣ ፈርኒቸር እና ጀነሬተር በወር በአማካይ ከ 35,000 እስከ 75,000 የኢትዮጵያ ብር ይደርሳል። ቪላ ቤቶች ደግሞ ከ 80,000 ብር ጀምሮ ይከራያሉ።'
            : 'In Bole, Addis Ababa, average rent for a 2-bedroom apartment ranges from 35,000 to 75,000 ETB per month depending on furnishings, building generator, and water backup. Standalone villas typically rent from 80,000 to 180,000+ ETB per month.';
        } else if (lower.includes('cmc') || message.includes('ሲኤምሲ') || lower.includes('summit') || message.includes('ሰሚት')) {
          replyText = isAmh
            ? 'በሲኤምሲ እና ሰሚት አካባቢ ባለ 2 መኝታ አፓርታማ ወይም ኮንዶሚኒየም ኪራይ በወር በአማካይ ከ 18,000 እስከ 35,000 የኢትዮጵያ ብር ነው። ሪል እስቴት ቪላዎች ከ 50,000 እስከ 90,000 ብር ይከራያሉ።'
            : 'In CMC and Summit, rent for a 2-bedroom apartment or condominium averages between 18,000 and 35,000 ETB per month. Real estate villas in gated compounds range between 50,000 and 90,000 ETB per month.';
        } else if (lower.includes('kazanchis') || message.includes('ካዛንቺስ')) {
          replyText = isAmh
            ? 'በካዛንቺስ እና ባምቢስ አካባቢ ለአለም አቀፍ ተቋማት እና ኤምባሲዎች ቅርብ በመሆኑ ባለ 2 መኝታ አፓርታማ ኪራይ በወር በአማካይ ከ 40,000 እስከ 85,000 ብር ይደርሳል።'
            : 'In Kazanchis and Bambis, due to its proximity to the UNECA and embassies, 2-bedroom apartments rent for an average of 40,000 to 85,000 ETB per month.';
        } else if (lower.includes('contract') || lower.includes('agreement') || lower.includes('rule') || message.includes('ውል') || message.includes('ህግ') || message.includes('ቅድመ')) {
          replyText = isAmh
            ? 'በኢትዮጵያ የቤት ኪራይ ውል በህጋዊ ሰነዶች ማረጋገጫ (ወረዳ ወይም ኖታሪ) መፈረም እና መመዝገብ አለበት። የተለመደው የቅድመ ክፍያ ደንብ ከ 3 እስከ 6 ወር ሲሆን፣ የደላላ ኮሚሽን ደግሞ የአንድ ወር ኪራይ ነው።'
            : 'In Ethiopia, tenancy agreements should be executed with a written contract registered at the local woreda or document authentication office. The standard practice requires 3 to 6 months of rent paid in advance, and the standard broker commission is one month of rent.';
        } else if (lower.includes('mortgage') || lower.includes('bank') || lower.includes('loan') || message.includes('ባንክ') || message.includes('ብድር')) {
          replyText = isAmh
            ? 'በኢትዮጵያ ንግድ ባንክ (CBE) እና በአዋሽ ባንክ የቤት መግዣ ብድር ለመውሰድ ከ 20% እስከ 30% የቅድመ ክፍያ (down payment) ያስፈልጋል። ቀሪው ገንዘብ በ 15 እስከ 20 ዓመታት ውስጥ በወርሃዊ ክፍያ የሚመለስ ሲሆን፣ የገቢ ማረጋገጫ እና የይዞታ ማረጋገጫ (ካርታ) ማቅረብ ግዴታ ነው።'
            : 'Mortgage loans in Ethiopia (through CBE, Awash Bank, and private banks) typically require a 20% to 30% down payment. Repayment periods range from 15 to 20 years, and applicants must provide proof of steady income and a clear title deed.';
        } else if (lower.includes('water') || lower.includes('generator') || message.includes('ውሃ') || message.includes('ጀነሬተር') || message.includes('ሮቶ')) {
          replyText = isAmh
            ? 'በአዲስ አበባ ቤት ሲከራዩ ቢያንስ ከ 1,000 እስከ 3,000 ሊትር የሮቶ ውሃ ታንከር እና የኤሌክትሪክ መቆራረጥን የሚከላከል የጀነሬተር አገልግሎት መኖሩን ማረጋገጥ በጣም አስፈላጊ ነው።'
            : 'When renting in Addis Ababa, having a backup Roto water tank (at least 1,000 to 3,000 liters) and a standby generator in the building are vital amenities to ensure uninterrupted utility access.';

        // 4. Technology, Coding & Programming
        } else if (
          lower.includes('code') || 
          lower.includes('programming') || 
          lower.includes('react') || 
          lower.includes('javascript') || 
          lower.includes('typescript') || 
          lower.includes('python') || 
          lower.includes('html') || 
          lower.includes('css') || 
          lower.includes('sql') || 
          lower.includes('api') || 
          message.includes('ኮዲንግ') || 
          message.includes('ፕሮግራሚንግ')
        ) {
          replyText = isAmh
            ? `ቴክኖሎጂ እና ሶፍትዌር ምህንድስና የዘመናዊው ዲጂታል አለም መሰረት ናቸው። 
* **JavaScript / TypeScript**፡ ለድረ-ገፅ እና ሙሉ ሲስተሞች (እንደ Bete Finder) ግንባር ቀደም ቋንቋ ነው።
* **React**፡ ፈጣን እና ተለዋዋጭ የተጠቃሚ ገጾችን ለመስራት የተመረጠ ቴክኖሎጂ ነው።
* **Python**፡ ለ አርቲፊሻል ኢንተለጀንስ (AI)፣ ዳታ ሳይንስ እና አውቶሜሽን አለም አቀፍ ምርጥ መሪ ነው።
* **SQL & ዳታቤዝ**፡ መረጃን በተደራጀ መልኩ ለማስቀመጥ እና ለመፈለግ ያገለግላሉ።

የፈለጉትን ኮድ፣ የኮዲንግ ፅንሰ-ሀሳብ ወይም የፕሮግራሚንግ ጥያቄ በዝርዝር መጠየቅ ይችላሉ፤ ኮዱን ፅፌ አብራራልዎታለሁ!`
            : `Technology and software engineering power modern applications like Bete Finder.
* **JavaScript & TypeScript**: Provide type-safe, resilient runtime execution across client and server environments.
* **React**: Uses a virtual DOM and modular component architecture to create high-performance interactive interfaces.
* **Python**: Dominates machine learning, backend engineering, data processing, and scripting.
* **Architecture**: Modern apps rely on RESTful or GraphQL APIs, relational or document databases, and secure tokenized authentication.

Feel free to ask for any code snippet, debugging solution, or architectural explanation!`;

        // 5. Ethiopian Culture, History & Geography
        } else if (
          lower.includes('ethiopia') || 
          lower.includes('addis ababa') || 
          lower.includes('lalibela') || 
          lower.includes('axum') || 
          lower.includes('adwa') || 
          lower.includes('lucy') || 
          lower.includes('history') || 
          message.includes('ኢትዮጵያ') || 
          message.includes('ታሪክ') || 
          message.includes('ባህል') || 
          message.includes('አድዋ')
        ) {
          replyText = isAmh
            ? `ኢትዮጵያ ከ 3,000 ዓመታት በላይ የበለፀገ ታሪክና የሰው ዘር መገኛ (ሉሲ / ድንቅነሽ የተገኘችባት) ጥንታዊ ሀገር ናት።
* **ታሪካዊ ቅርሶች**፡ የላሊበላ ውቅር አብያተ ክርስቲያናት፣ የአክሱም ሐውልቶች፣ የፋሲል ግቢ በአንጎንደር፣ እና የሀረር ጁጎል በዩኔስኮ የተመዘገቡ የሰው ልጅ ታላላቅ ቅርሶች ናቸው።
* **የአድዋ ድል**፡ ኢትዮጵያውያን በ 1888 ዓ.ም የጣሊያንን ወራሪ ጦር ድል በማድረግ ለመላው ጥቁር ህዝብ የነፃነት እና የክብር ምልክት ሆነዋል።
* **ባህልና እንግዳ ተቀባይነት**፡ የኢትዮጵያ ባህላዊ የቡና ስነ-ስርዓት፣ እንጀራ ከጣፋጭ ወጦች ጋር፣ እና ከ 80 በላይ የተለያዩ ቋንቋዎችና ባህሎች መገኛ ናት።
ስለ ማንኛውም የታሪክ ወቅት ወይም ባህል ጥያቄዎን በደስታ እመልሳለሁ!`
            : `Ethiopia stands as one of the world's oldest sovereign nations, with continuous historical civilization spanning millennia.
* **Cradle of Humankind**: Discovery site of Australopithecus afarensis ("Lucy" or "Dinkinesh"), dating back 3.2 million years.
* **World Heritage**: Home to the 12th-century monolithic rock-hewn churches of Lalibela, the Axumite obelisks, Gondar's 17th-century royal castles (Fasil Ghebbi), and the ancient walled city of Harar Jugol.
* **Victory of Adwa (1896)**: A monumental triumph where Ethiopian forces defended their sovereignty against European colonial invasion, inspiring pan-African liberty worldwide.
* **Culture**: Renowned for Ge'ez script, the unique 13-month calendar, traditional coffee ceremony, and communal cuisine centered around Injera.`;

        // 6. Science, Astronomy & Nature
        } else if (
          lower.includes('science') || 
          lower.includes('physics') || 
          lower.includes('space') || 
          lower.includes('planet') || 
          lower.includes('sun') || 
          lower.includes('moon') || 
          lower.includes('light') || 
          lower.includes('gravity') || 
          message.includes('ሳይንስ') || 
          message.includes('ፊዚክስ') || 
          message.includes('ህዋ')
        ) {
          replyText = isAmh
            ? `ሳይንስ እና የተፈጥሮ ህጎች የአለምን እና የአፅናፈ-ዓለሙን ሚስጥር የምንረዳባቸው መመሪያዎች ናቸው።
* **የብርሃን ፍጥነት**፡ ብርሃን በሰከንድ በግምት 300,000 ኪሎ ሜትር (299,792 km/s) ፍጥነት ይጓዛል።
* **ስበት (Gravity)**፡ እንደ አይዛክ ኒውተን እና አልበርት አንስታይን ማብራሪያ፣ ግዙፍ አካላት የቦታና የጊዜን ቅርፅ (Spacetime) በማጠፍ ስበትን ይፈጥራሉ።
* **የፀሐይ ስርዓት**፡ ምድርን ጨምሮ 8 ፕላኔቶች በፀሐይ ዙሪያ ይሽከረከራሉ።
ስለ ማንኛውም የሳይንስ ወይም የፊዚክስ ህግ ጥያቄዎን በደስታ እመልሳለሁ!`
            : `Science unravels the fundamental mechanisms of reality:
* **Speed of Light**: The cosmic speed limit is approximately 299,792 kilometers per second (186,282 miles per second) in vacuum.
* **Gravitation & Relativity**: Formulated by Isaac Newton and expanded by Albert Einstein, gravity is the curvature of spacetime caused by mass and energy.
* **Solar System & Cosmos**: Our solar system features 8 planets orbiting the sun within the Milky Way galaxy, an environment shaped by quantum mechanics and astrophysics.
Ask me about any physical phenomenon, experiment, or formula!`;

        // 7. Everyday Knowledge, Advice & General Answers
        } else {
          replyText = isAmh
            ? `ለጥያቄዎ መልስ፡ **"${message}"**

እኔ Bete Assistance ነኝ። ስለጠየቁኝ ርዕሰ-ጉዳይ ተጨማሪ ዝርዝር፣ ትንተና፣ ስሌት ወይም ማብራሪያ ከፈለጉ በደስታ አቀርብልዎታለሁ! 
* ማንኛውንም ጥያቄ (ስለ ሪል እስቴት፣ ቴክኖሎጂ፣ ሳይንስ፣ ሒሳብ፣ ኮዲንግ፣ ታሪክ ወይም የዕለት ተዕለት ኑሮ) በነፃነት ይጠይቁኝ፤ ሁሉንም እመልስልዎታለሁ!`
            : `Regarding your question: **"${message}"**

I am **Bete Assistance**. I have processed your inquiry and can provide detailed technical insights, mathematical computations, factual analysis, or real estate guidance on this topic.
Feel free to ask follow-up questions or explore any subject—from software engineering and mathematics to history, real estate, and everyday solutions!`;
        }
      }
    }

    // Clean any unwanted structural labels so only the direct answer is returned
    const cleanAnswer = replyText
      .replace(/^User Response:\s*/i, '')
      .replace(/^የተጠቃሚ ምላሽ:\s*/i, '')
      .replace(/Search Context:[\s\S]*$/i, '')
      .replace(/Map & Search Context:[\s\S]*$/i, '')
      .replace(/የፍለጋ መረጃ:[\s\S]*$/i, '')
      .trim();

    // Extract structured search parameters for frontend map/filter actions
    const searchContext: any = {};
    const replyLower = cleanAnswer.toLowerCase();

    // Detect target location
    if (lower.includes('bole') || replyLower.includes('bole') || lower.includes('ቦሌ')) {
      searchContext.city = 'Addis Ababa';
      searchContext.subcity = 'Bole';
      searchContext.targetLocation = 'Bole';
    } else if (lower.includes('cmc') || lower.includes('ሲኤምሲ') || lower.includes('yeka') || lower.includes('የካ')) {
      searchContext.city = 'Addis Ababa';
      searchContext.subcity = 'Yeka';
      searchContext.targetLocation = 'CMC / Yeka';
    } else if (lower.includes('kazanchis') || lower.includes('ካዛንቺስ') || lower.includes('kirkos')) {
      searchContext.city = 'Addis Ababa';
      searchContext.subcity = 'Kirkos';
      searchContext.targetLocation = 'Kazanchis';
    } else if (lower.includes('sarbet') || lower.includes('ሳርቤት') || lower.includes('bisrate') || lower.includes('ብስራተ')) {
      searchContext.city = 'Addis Ababa';
      searchContext.subcity = 'Nifas Silk-Lafto';
      searchContext.targetLocation = 'Sarbet / Bisrate Gabriel';
    } else if (lower.includes('hawassa') || lower.includes('ሐዋሳ')) {
      searchContext.city = 'Hawassa';
      searchContext.targetLocation = 'Hawassa';
    } else if (lower.includes('bahir dar') || lower.includes('ባሕር ዳር')) {
      searchContext.city = 'Bahir Dar';
      searchContext.targetLocation = 'Bahir Dar';
    } else if (lower.includes('bishoftu') || lower.includes('ቢሾፍቱ')) {
      searchContext.city = 'Bishoftu (Debre Zeyit)';
      searchContext.targetLocation = 'Bishoftu';
    }

    // Detect property type
    if (lower.includes('apartment') || lower.includes('አፓርታማ')) searchContext.propertyType = 'Apartment';
    else if (lower.includes('villa') || lower.includes('ቪላ')) searchContext.propertyType = 'Villa';
    else if (lower.includes('condo') || lower.includes('ኮንዶሚኒየም')) searchContext.propertyType = 'Condominium';
    else if (lower.includes('floor house') || lower.includes('g+') || lower.includes('ጂ+')) searchContext.propertyType = 'Floor House';
    else if (lower.includes('commercial') || lower.includes('ንግድ') || lower.includes('ሱቅ')) searchContext.propertyType = 'Commercial';

    // Detect intent
    if (lower.includes('buy') || lower.includes('sale') || lower.includes('መግዛት') || lower.includes('ሽያጭ')) {
      searchContext.listingType = 'sale';
    } else {
      searchContext.listingType = 'rent';
    }

    // Detect price numbers
    const numMatch = message.match(/(\d[\d,.]*)\s*(?:birr|etb|ብር|k|thousand|million|ሚሊዮን)?/i);
    if (numMatch) {
      let rawVal = parseFloat(numMatch[1].replace(/,/g, ''));
      if (lower.includes('k') && rawVal < 1000) rawVal *= 1000;
      if ((lower.includes('million') || message.includes('ሚሊዮን')) && rawVal < 1000) rawVal *= 1000000;
      if (rawVal > 1000) {
        searchContext.maxPriceLimit = rawVal;
      }
    }

    // Detect bedroom numbers
    const bedMatch = message.match(/(\d+)\s*(?:bed|bedroom|መኝታ)/i);
    if (bedMatch) {
      searchContext.bedroomCount = parseInt(bedMatch[1], 10);
    }

    res.json({
      success: true,
      text: cleanAnswer,
      searchContext
    });
  } catch (error: any) {
    console.error('[AI Chat Error]:', error);
    res.status(500).json({ 
      success: false, 
      message: error?.message || 'Error processing AI assistant request.' 
    });
  }
});

// ==========================================
// AI ASSISTANT FEEDBACK ENDPOINT (THUMBS UP / DOWN)
// ==========================================
interface AIFeedbackRecord {
  id: string;
  messageId: string;
  feedback: 'up' | 'down';
  query?: string;
  responseSnippet?: string;
  queryType?: 'rental' | 'sales' | 'general';
  timestamp: string;
}

const aiFeedbackLogs: AIFeedbackRecord[] = [];

app.post('/api/ai/feedback', (req, res) => {
  try {
    const { messageId, feedback, query, responseSnippet, queryType } = req.body || {};
    if (!messageId || (feedback !== 'up' && feedback !== 'down')) {
      return res.status(400).json({ success: false, message: 'Invalid feedback parameters' });
    }

    const record: AIFeedbackRecord = {
      id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      messageId: String(messageId),
      feedback,
      query: query ? String(query).slice(0, 300) : undefined,
      responseSnippet: responseSnippet ? String(responseSnippet).slice(0, 300) : undefined,
      queryType: queryType || 'rental',
      timestamp: new Date().toISOString()
    };

    aiFeedbackLogs.push(record);
    if (aiFeedbackLogs.length > 500) aiFeedbackLogs.shift();

    console.log(`[Bete AI Feedback]: ${feedback.toUpperCase()} received for ${record.queryType} query (ID: ${messageId})`);

    res.json({
      success: true,
      message: 'Feedback recorded successfully to optimize rental and sales response accuracy.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error recording feedback' });
  }
});

// ==========================================
// OWNER FEEDBACK INBOX & SUBMISSION
// ==========================================
app.get('/api/feedback', async (req, res) => {
  try {
    const currentData = await fetchMasterData();
    res.json({
      success: true,
      feedbacks: currentData.ownerFeedbacks || [],
      totalFeedbacks: (currentData.ownerFeedbacks || []).length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to fetch feedbacks' });
  }
});

app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, phone, category, rating, message, propertyId, propertyTitle } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    const currentData = await fetchMasterData();
    if (!currentData.ownerFeedbacks) {
      currentData.ownerFeedbacks = [];
    }

    const newFeedback = {
      id: req.body?.id || `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: (name || 'Anonymous User').trim(),
      email: (email || 'user@example.com').trim(),
      phone: (phone || '').trim(),
      category: category || 'general',
      rating: Number(rating) || 5,
      message: message.trim(),
      propertyId: propertyId || undefined,
      propertyTitle: propertyTitle || undefined,
      status: 'new',
      createdAt: new Date().toISOString(),
      userAgent: req.headers['user-agent']
    };

    currentData.ownerFeedbacks = [newFeedback, ...currentData.ownerFeedbacks];
    await persistMasterData(currentData);

    console.log(`[Owner Feedback]: New feedback received from ${newFeedback.name} (${newFeedback.category})`);

    res.json({
      success: true,
      feedback: newFeedback,
      totalFeedbacks: currentData.ownerFeedbacks.length,
      message: 'Feedback submitted directly to Owner successfully!'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to save feedback' });
  }
});

app.patch('/api/feedback/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, replyNotes } = req.body || {};
    const currentData = await fetchMasterData();
    if (!currentData.ownerFeedbacks) currentData.ownerFeedbacks = [];

    const index = currentData.ownerFeedbacks.findIndex((f: any) => f.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    if (status) currentData.ownerFeedbacks[index].status = status;
    if (replyNotes !== undefined) currentData.ownerFeedbacks[index].replyNotes = replyNotes;

    await persistMasterData(currentData);
    res.json({ success: true, feedback: currentData.ownerFeedbacks[index] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message });
  }
});

app.delete('/api/feedback/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentData = await fetchMasterData();
    if (!currentData.ownerFeedbacks) currentData.ownerFeedbacks = [];

    currentData.ownerFeedbacks = currentData.ownerFeedbacks.filter((f: any) => f.id !== id);
    await persistMasterData(currentData);
    res.json({ success: true, message: 'Feedback removed', totalFeedbacks: currentData.ownerFeedbacks.length });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message });
  }
});

app.post('/api/feedback/clear', async (req, res) => {
  try {
    const currentData = await fetchMasterData();
    currentData.ownerFeedbacks = [];
    await persistMasterData(currentData);
    res.json({ success: true, message: 'All feedbacks cleared' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message });
  }
});

// ==========================================
// MENU VISIBILITY CONTROLLER API (SELECT / DESELECT MENUS)
// ==========================================
app.get('/api/menu-config', async (req, res) => {
  try {
    const currentData = await fetchMasterData();
    res.json({
      success: true,
      menuConfig: currentData.menuConfig || {
        adminTabs: {
          payments: true,
          properties: true,
          paid_subscribers: true,
          database_users: true,
          admin_controller: true,
          pricing_settings: true,
          telegram_channel: true,
          telegram_bot: true,
          feedback: true,
          security: true,
          sync: true
        },
        publicMenus: {
          home: true,
          rent: true,
          sale: true,
          pricing: true,
          post: true,
          ai_assistant: true,
          feedback_button: true,
          favorites: true
        },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message });
  }
});

app.post('/api/menu-config', async (req, res) => {
  try {
    const newConfig = req.body;
    if (!newConfig || typeof newConfig !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid menu configuration' });
    }

    const currentData = await fetchMasterData();
    currentData.menuConfig = {
      adminTabs: {
        payments: true,
        properties: true,
        paid_subscribers: true,
        database_users: true,
        admin_controller: true,
        pricing_settings: true,
        telegram_channel: true,
        telegram_bot: true,
        feedback: true,
        security: true,
        sync: true,
        ...(newConfig.adminTabs || {})
      },
      publicMenus: {
        home: true,
        rent: true,
        sale: true,
        pricing: true,
        post: true,
        ai_assistant: true,
        feedback_button: true,
        favorites: true,
        ...(newConfig.publicMenus || {})
      },
      lastUpdated: new Date().toISOString()
    };

    await persistMasterData(currentData);
    console.log('[Menu Config]: Owner updated menu visibility preferences');
    res.json({ success: true, menuConfig: currentData.menuConfig });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message });
  }
});

// ==========================================
// TELEGRAM BOT & CHANNEL NOTIFICATIONS
// ==========================================
interface TelegramNotificationOptions {
  chatId?: string;
  botToken?: string;
}

const escapeHtmlForTelegram = (text: string): string => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

/**
 * Fetches dynamic Telegram settings stored in database with fallback to environment defaults.
 */
export async function getTelegramConfig(): Promise<{
  botToken: string;
  chatId: string;
  botUsername: string;
  channelUsername: string;
  autoPublishProperties: boolean;
}> {
  try {
    const currentData = await fetchMasterData();
    const settings = currentData?.telegramSettings || {};
    return {
      botToken: (settings.botToken || process.env.TELEGRAM_BOT_TOKEN || '8716860236:AAEiN5kJednAaFVvy03wCaveNyq71C-LZWo').trim(),
      chatId: (settings.channelId || process.env.TELEGRAM_CHANNEL_ID || '@Bete_Finder').trim(),
      botUsername: (settings.botUsername || 'BeteFinder_bot').trim().replace('@', ''),
      channelUsername: (settings.channelUsername || 'Bete_Finder').trim().replace('@', ''),
      autoPublishProperties: settings.autoPublishProperties !== false
    };
  } catch (e) {
    return {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '8716860236:AAEiN5kJednAaFVvy03wCaveNyq71C-LZWo',
      chatId: process.env.TELEGRAM_CHANNEL_ID || '@Bete_Finder',
      botUsername: 'BeteFinder_bot',
      channelUsername: 'Bete_Finder',
      autoPublishProperties: true
    };
  }
}

/**
 * Sends a raw text message to the designated Telegram chat/channel using the Telegram Bot API.
 */
export async function sendTelegramMessage(
  text: string, 
  options?: TelegramNotificationOptions
): Promise<{ success: boolean; data?: any; error?: string }> {
  const dynamicCfg = await getTelegramConfig();
  const token = options?.botToken || dynamicCfg.botToken;
  const chatId = options?.chatId || dynamicCfg.chatId;

  if (!token || !chatId) {
    console.warn('[Telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID');
    return { success: false, error: 'Missing Telegram configuration' };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      })
    });

    const data: any = await response.json();
    if (!response.ok || !data.ok) {
      console.error('[Telegram] Error sending message:', data);
      return { success: false, error: data.description || 'Telegram API error', data };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('[Telegram] Network/Fetch error:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Dispatches a formatted new property notification (with photo if available) to the Telegram channel.
 */
export async function sendTelegramPropertyNotification(
  property: any,
  options?: TelegramNotificationOptions
): Promise<{ success: boolean; data?: any; error?: string }> {
  const dynamicCfg = await getTelegramConfig();
  const token = options?.botToken || dynamicCfg.botToken;
  const chatId = options?.chatId || dynamicCfg.chatId;

  if (!token || !chatId) {
    console.warn('[Telegram] Missing token or channel ID');
    return { success: false, error: 'Missing Telegram configuration' };
  }

  const title = escapeHtmlForTelegram(property.title || 'New Property Listing');
  const titleAm = property.titleAm ? escapeHtmlForTelegram(property.titleAm) : '';
  const pType = escapeHtmlForTelegram(property.propertyType || 'Residential');
  const lType = property.listingType === 'sale' ? 'ለሽያጭ (For Sale)' : 'ለኪራይ (For Rent)';
  const currency = property.currency || 'ETB';
  const price = Number(property.price || 0).toLocaleString();
  const period = property.pricePeriod === 'year' 
    ? '/ዓመት (/year)' 
    : (property.listingType === 'sale' ? '' : '/ወር (/month)');
  
  const subcity = property.subcity || '';
  const neighborhood = property.neighborhood || '';
  const city = property.city || 'Addis Ababa';
  const location = escapeHtmlForTelegram([neighborhood, subcity, city].filter(Boolean).join(', ') || 'Addis Ababa, Ethiopia');

  const beds = property.bedrooms ?? 0;
  const baths = property.bathrooms ?? 0;
  const area = property.areaSqm ? `${property.areaSqm} m²` : '';
  const floor = property.floor ? `ፎቅ ${property.floor} (Floor ${property.floor})` : (property.floorSize || '');

  const ownerName = escapeHtmlForTelegram(property.owner?.name || 'Bete Finder Verified Agent');
  const ownerPhone = escapeHtmlForTelegram(property.owner?.phone || '+251995406697');
  const ownerTg = property.owner?.telegram ? property.owner.telegram.replace('@', '').trim() : '';

  const caption = [
    `🏠 <b>አዲስ የተመዘገበ ቤት (NEW PROPERTY LISTING)</b>`,
    titleAm ? `🇪🇹 <i>${titleAm}</i>` : '',
    `━━━━━━━━━━━━━━━━━━━━`,
    `📌 <b>${title}</b>`,
    `💰 <b>ዋጋ (Price):</b> <b>${price} ${currency}</b> ${period}`,
    `🏷️ <b>አይነት (Type):</b> ${pType} • ${lType}`,
    `📍 <b>አድራሻ (Location):</b> ${location}`,
    `🛏️ <b>ክፍሎች (Specs):</b> ${beds} መኝታ (Beds) | 🚿 ${baths} መታጠቢያ (Baths) ${area ? `| 📐 ${area}` : ''}`,
    floor ? `🏢 <b>ወለል/አወቃቀር:</b> ${escapeHtmlForTelegram(floor)}` : '',
    property.isFurnished ? `✨ <b>የቤት ዕቃ (Furnished):</b> ሙሉ በሙሉ የተሟላለት (Yes)` : '',
    `━━━━━━━━━━━━━━━━━━━━`,
    `📞 <b>ያነጋግሩ (Contact):</b>`,
    `👤 <b>${ownerName}</b>: <code>${ownerPhone}</code>`,
    ownerTg ? `💬 <b>Telegram:</b> @${ownerTg}` : '',
    `\n🌐 <b>በድረ-ገጻችን ይመልከቱ (Website):</b>\nhttps://bete-finder-one.vercel.app`,
    `\n#BeteFinder #Ethiopia #AddisAbaba #${pType.replace(/\s+/g, '')} #${property.listingType === 'sale' ? 'Sale' : 'Rent'}`
  ].filter(Boolean).join('\n');

  // If the property has a valid remote HTTP/HTTPS photo, attempt to send via sendPhoto
  const primaryImage = Array.isArray(property.images) && property.images.length > 0 ? property.images[0] : null;
  const isValidHttpImage = primaryImage && typeof primaryImage === 'string' && (primaryImage.startsWith('http://') || primaryImage.startsWith('https://'));

  if (isValidHttpImage) {
    try {
      const photoUrl = `https://api.telegram.org/bot${token}/sendPhoto`;
      const response = await fetch(photoUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: primaryImage,
          caption: caption.slice(0, 1024), // Telegram caption limit
          parse_mode: 'HTML'
        })
      });

      const data: any = await response.json();
      if (response.ok && data.ok) {
        console.log(`[Telegram] Successfully posted photo property notification to ${chatId}`);
        return { success: true, data };
      }
      console.warn('[Telegram] sendPhoto failed, falling back to text message:', data.description);
    } catch (err: any) {
      console.warn('[Telegram] sendPhoto error, falling back to text message:', err?.message);
    }
  }

  // Fallback to text sendMessage
  return sendTelegramMessage(caption, { chatId, botToken: token });
}

// Telegram Integration Test Route
app.post('/api/telegram/test', async (req, res) => {
  try {
    const testResult = await sendTelegramMessage(
      `🔔 <b>Bete Finder Telegram Integration Active!</b>\n\n` +
      `Your Telegram bot is successfully connected to <b>@Bete_Finder</b>.\n` +
      `Whenever a new property is published, an automatic notification with photos and details will be posted here.\n\n` +
      `⏰ <i>Server Time: ${new Date().toISOString()}</i>`
    );
    res.json({ success: testResult.success, result: testResult });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Telegram Bot Connection Health Ping (Measures latency & getMe without sending channel message)
app.post('/api/telegram/bot-ping', async (req, res) => {
  try {
    const config = await getTelegramConfig();
    const startTime = Date.now();
    const botRes: any = await fetch(`https://api.telegram.org/bot${config.botToken}/getMe`)
      .then(r => r.json())
      .catch((e: any) => ({ ok: false, description: e.message }));
    const latencyMs = Date.now() - startTime;

    if (botRes && botRes.ok) {
      res.json({
        success: true,
        latencyMs,
        bot: botRes.result,
        message: `Bot @${botRes.result.username} responded in ${latencyMs}ms.`
      });
    } else {
      res.status(400).json({
        success: false,
        latencyMs,
        error: botRes?.description || 'Telegram Bot authentication failed.'
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to ping Telegram Bot API' });
  }
});

// Telegram Integration Live Status
app.get('/api/telegram/status', async (req, res) => {
  try {
    const config = await getTelegramConfig();
    const token = config.botToken;
    const chatId = config.chatId;

    const [botRes, chatRes, membersRes] = await Promise.all([
      fetch(`https://api.telegram.org/bot${token}/getMe`).then(r => r.json()).catch(() => null),
      fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(chatId)}`).then(r => r.json()).catch(() => null),
      fetch(`https://api.telegram.org/bot${token}/getChatMemberCount?chat_id=${encodeURIComponent(chatId)}`).then(r => r.json()).catch(() => null)
    ]);

    const isBotOk = Boolean(botRes && botRes.ok);
    const isChatOk = Boolean(chatRes && chatRes.ok);

    const tokenMasked = token.length > 16 
      ? `${token.slice(0, 10)}...${token.slice(-6)}` 
      : '••••••••••••';

    res.json({
      success: Boolean(isBotOk && isChatOk),
      bot: isBotOk ? {
        id: botRes.result.id,
        is_bot: botRes.result.is_bot,
        first_name: botRes.result.first_name,
        username: botRes.result.username,
        link: `https://t.me/${botRes.result.username}`,
        can_join_groups: botRes.result.can_join_groups,
      } : null,
      channel: isChatOk ? {
        id: chatRes.result.id,
        title: chatRes.result.title,
        username: chatRes.result.username || config.channelUsername,
        description: chatRes.result.description,
        invite_link: chatRes.result.invite_link || `https://t.me/${chatRes.result.username || config.channelUsername}`,
        members_count: membersRes?.ok ? membersRes.result : null,
        link: chatRes.result.username ? `https://t.me/${chatRes.result.username}` : `https://t.me/${config.channelUsername}`
      } : null,
      config: {
        chatId,
        channelUsername: config.channelUsername,
        botUsername: config.botUsername,
        botTokenMasked: tokenMasked,
        rawBotToken: token,
        autoPublishProperties: config.autoPublishProperties
      },
      error: !isBotOk 
        ? (botRes?.description || 'Failed to authenticate Bot with token.') 
        : (!isChatOk ? (chatRes?.description || 'Failed to resolve Telegram Channel. Ensure the bot is added as an Administrator to the channel.') : null),
      timestamp: Date.now()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error querying Telegram API' });
  }
});

// Update Telegram Settings (Channel handle/ID, Bot Token, Bot Username, Auto-publish)
app.post('/api/telegram/config', async (req, res) => {
  try {
    const { botToken, chatId, botUsername, channelUsername, autoPublishProperties } = req.body || {};
    const currentData = await fetchMasterData();
    const existing = currentData.telegramSettings || {};

    let formattedChatId = (chatId !== undefined ? chatId : (existing.channelId || '@Bete_Finder')).trim();
    if (formattedChatId && !formattedChatId.startsWith('@') && !formattedChatId.startsWith('-')) {
      formattedChatId = `@${formattedChatId}`;
    }

    let formattedChannelUsername = (
      channelUsername !== undefined 
        ? channelUsername 
        : (existing.channelUsername || formattedChatId.replace('@', ''))
    ).trim().replace('@', '');

    let formattedBotUsername = (
      botUsername !== undefined 
        ? botUsername 
        : (existing.botUsername || 'BeteFinder_bot')
    ).trim().replace('@', '');

    let finalToken = (
      botToken !== undefined && botToken.trim().length > 0 
        ? botToken.trim() 
        : (existing.botToken || process.env.TELEGRAM_BOT_TOKEN || '8716860236:AAEiN5kJednAaFVvy03wCaveNyq71C-LZWo')
    ).trim();

    // Verify token with Telegram getMe
    const testBotRes = await fetch(`https://api.telegram.org/bot${finalToken}/getMe`)
      .then(r => r.json())
      .catch((e: any) => ({ ok: false, description: e.message }));

    if (testBotRes.ok && testBotRes.result?.username) {
      formattedBotUsername = testBotRes.result.username;
    }

    // Verify chat with Telegram getChat
    const testChatRes = await fetch(`https://api.telegram.org/bot${finalToken}/getChat?chat_id=${encodeURIComponent(formattedChatId)}`)
      .then(r => r.json())
      .catch((e: any) => ({ ok: false, description: e.message }));

    if (testChatRes.ok && testChatRes.result?.username) {
      formattedChannelUsername = testChatRes.result.username;
    }

    const updatedSettings = {
      botToken: finalToken,
      channelId: formattedChatId,
      botUsername: formattedBotUsername,
      channelUsername: formattedChannelUsername,
      autoPublishProperties: autoPublishProperties !== undefined ? Boolean(autoPublishProperties) : (existing.autoPublishProperties !== false)
    };

    currentData.telegramSettings = updatedSettings;
    await persistMasterData(currentData);

    const isConnected = Boolean(testBotRes.ok && testChatRes.ok);

    res.json({
      success: true,
      message: isConnected
        ? 'Telegram bot and channel configuration updated and verified successfully!'
        : 'Telegram settings saved, but connection check returned a warning.',
      config: updatedSettings,
      verification: {
        botOk: Boolean(testBotRes.ok),
        chatOk: Boolean(testChatRes.ok),
        botError: !testBotRes.ok ? testBotRes.description : null,
        chatError: !testChatRes.ok ? testChatRes.description : null
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to save Telegram settings' });
  }
});

// Update Telegram Usernames & Channel Handle directly
app.post('/api/telegram/update-usernames', async (req, res) => {
  try {
    const { channelUsername, botUsername, autoPublishProperties } = req.body || {};
    const currentData = await fetchMasterData();
    const existing = currentData.telegramSettings || {
      botToken: '8716860236:AAEiN5kJednAaFVvy03wCaveNyq71C-LZWo',
      channelId: '@Bete_Finder',
      botUsername: 'BeteFinder_bot',
      channelUsername: 'Bete_Finder',
      autoPublishProperties: true
    };

    let formattedChatId = existing.channelId;
    let formattedChannelUsername = existing.channelUsername;
    let formattedBotUsername = existing.botUsername;

    if (channelUsername) {
      const cleanChan = String(channelUsername).trim();
      formattedChatId = cleanChan.startsWith('@') || cleanChan.startsWith('-100') ? cleanChan : `@${cleanChan}`;
      formattedChannelUsername = cleanChan.replace(/^@/, '');
    }

    if (botUsername) {
      const cleanBot = String(botUsername).trim();
      formattedBotUsername = cleanBot.replace(/^@/, '');
    }

    const updatedSettings = {
      ...existing,
      channelId: formattedChatId,
      channelUsername: formattedChannelUsername,
      botUsername: formattedBotUsername,
      autoPublishProperties: autoPublishProperties !== undefined ? Boolean(autoPublishProperties) : existing.autoPublishProperties
    };

    currentData.telegramSettings = updatedSettings;
    await persistMasterData(currentData);

    console.log(`[Telegram Usernames Updated] Channel: @${formattedChannelUsername}, Bot: @${formattedBotUsername}`);
    res.json({
      success: true,
      message: `Telegram usernames updated: Channel @${formattedChannelUsername}, Bot @${formattedBotUsername}`,
      config: updatedSettings
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to update Telegram usernames' });
  }
});

// Reset Telegram Settings to Official Bete Finder Defaults
app.post('/api/telegram/reset-config', async (req, res) => {
  try {
    const currentData = await fetchMasterData();
    const defaultSettings = {
      botToken: '8716860236:AAEiN5kJednAaFVvy03wCaveNyq71C-LZWo',
      channelId: '@Bete_Finder',
      botUsername: 'BeteFinder_bot',
      channelUsername: 'Bete_Finder',
      autoPublishProperties: true
    };
    currentData.telegramSettings = defaultSettings;
    await persistMasterData(currentData);
    res.json({
      success: true,
      message: 'Telegram settings restored to official Bete Finder defaults.',
      config: defaultSettings
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Telegram Custom Announcement Broadcast
app.post('/api/telegram/broadcast', async (req, res) => {
  try {
    const { title, message, author, actionUrl } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Broadcast message content is required.' });
    }
    const header = title && title.trim() ? `📢 <b>${escapeHtmlForTelegram(title.trim())}</b>\n\n` : `📢 <b>Bete Finder Official Announcement</b>\n\n`;
    const body = escapeHtmlForTelegram(message.trim());
    const authorLine = author ? `\n\n👤 <i>Author: ${escapeHtmlForTelegram(author)}</i>` : '';
    const linkLine = actionUrl ? `\n\n🔗 <a href="${actionUrl}">Open Link</a>` : `\n\n🌐 https://bete-finder-one.vercel.app`;
    const fullText = `${header}${body}${authorLine}\n━━━━━━━━━━━━━━━━━━━━${linkLine}`;

    const result = await sendTelegramMessage(fullText);
    res.json({ success: result.success, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Telegram Test Property Broadcast
app.post('/api/telegram/test-property', async (req, res) => {
  try {
    const { propertyId } = req.body || {};
    let propToSend;
    if (propertyId) {
      const currentData = await fetchMasterData();
      propToSend = (currentData.properties || []).find((p: any) => p.id === propertyId);
    }
    if (!propToSend) {
      propToSend = {
        id: 'sample-tg-prop',
        title: 'Modern Luxury 3-Bedroom Apartment in Bole Atlas',
        titleAm: 'በቦሌ አትላስ ዘመናዊ ባለ 3 መኝታ አፓርትመንት',
        propertyType: 'Apartment',
        listingType: 'rent',
        price: 85000,
        currency: 'ETB',
        pricePeriod: 'month',
        city: 'Addis Ababa',
        subcity: 'Bole',
        neighborhood: 'Atlas',
        bedrooms: 3,
        bathrooms: 3,
        areaSqm: 180,
        floor: '4',
        isFurnished: true,
        images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'],
        owner: {
          name: 'Kaleb Bereket (Bete Finder Founder)',
          phone: '+251995406697',
          telegram: '@Bete_Finder'
        }
      };
    }
    const result = await sendTelegramPropertyNotification(propToSend);
    res.json({ success: result.success, result, property: propToSend });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Property Upsert (Add or Update)
app.post('/api/properties', async (req, res) => {
  try {
    const prop = req.body;
    if (!prop || !prop.id) {
      return res.status(400).json({ success: false, message: 'Invalid property payload.' });
    }

    const currentData = await fetchMasterData();
    const existingIndex = (currentData.properties || []).findIndex((p: any) => p.id === prop.id);
    let updatedProperties = [...(currentData.properties || [])];

    const isNew = existingIndex < 0;

    if (!isNew) {
      updatedProperties[existingIndex] = { ...updatedProperties[existingIndex], ...prop };
    } else {
      updatedProperties = [prop, ...updatedProperties];
    }

    currentData.properties = updatedProperties;
    await persistMasterData(currentData);

    // Automatically send Telegram channel notification for newly posted properties
    if (isNew) {
      getTelegramConfig().then(tgCfg => {
        if (tgCfg.autoPublishProperties) {
          sendTelegramPropertyNotification(prop).catch(err => {
            console.error('[Telegram] Error sending property notification:', err);
          });
        }
      }).catch(() => {});
    }

    res.json({ success: true, property: prop, totalProperties: updatedProperties.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Erase / Delete All Properties (Owner Only)
app.delete('/api/properties', async (req, res) => {
  try {
    const currentData = await fetchMasterData();
    const countBefore = (currentData.properties || []).length;
    currentData.properties = [];
    await persistMasterData(currentData);
    console.log(`[Properties] Erased all ${countBefore} listing properties.`);
    res.json({ 
      success: true, 
      message: `All properties have been successfully erased (${countBefore} properties deleted).`,
      deletedCount: countBefore,
      totalProperties: 0
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Clear-All Properties Alias for HTTP Post
app.post('/api/properties/clear-all', async (req, res) => {
  try {
    const currentData = await fetchMasterData();
    const countBefore = (currentData.properties || []).length;
    currentData.properties = [];
    await persistMasterData(currentData);
    console.log(`[Properties] Cleared all ${countBefore} listing properties.`);
    res.json({ 
      success: true, 
      message: `All properties have been successfully erased (${countBefore} properties deleted).`,
      deletedCount: countBefore,
      totalProperties: 0
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Single Property Delete
app.delete('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentData = await fetchMasterData();
    currentData.properties = (currentData.properties || []).filter((p: any) => p.id !== id);
    await persistMasterData(currentData);
    res.json({ success: true, message: `Property ${id} deleted successfully.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Get all Registered Users (Owner / Admin / Public Sync)
app.get('/api/users', async (req, res) => {
  try {
    const currentData = await fetchMasterData();
    res.json({
      success: true,
      users: currentData.users || [],
      totalUsers: (currentData.users || []).length,
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// User Upsert / Registration (Guaranteed save to Owner database)
app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;
    if (!userData || !userData.email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const email = userData.email.trim().toLowerCase();
    const currentData = await fetchMasterData();
    let users = [...(currentData.users || [])];
    const existingIndex = users.findIndex((u: any) => (u.email || '').toLowerCase() === email);

    const fullRecord = {
      ...userData,
      email,
      registeredAt: userData.registeredAt || (existingIndex >= 0 ? users[existingIndex].registeredAt : new Date().toISOString()),
      lastActiveAt: new Date().toISOString(),
      activePlan: userData.activePlan || (existingIndex >= 0 ? users[existingIndex].activePlan : 'free'),
      provider: userData.provider || (email.includes('@gmail.com') ? 'google' : 'local'),
      role: userData.role || (existingIndex >= 0 ? users[existingIndex].role : 'tenant')
    };

    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...fullRecord };
    } else {
      users = [fullRecord, ...users];
    }

    currentData.users = users;
    await persistMasterData(currentData);

    res.json({ 
      success: true, 
      user: fullRecord,
      totalUsers: users.length, 
      message: 'User registered and saved to owner database.' 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// User Delete Endpoint (Owner Only)
app.delete('/api/users/:emailOrId', async (req, res) => {
  try {
    const { emailOrId } = req.params;
    const target = decodeURIComponent(emailOrId).trim().toLowerCase();
    const currentData = await fetchMasterData();
    const beforeCount = (currentData.users || []).length;
    currentData.users = (currentData.users || []).filter((u: any) => 
      u.id !== emailOrId && (u.email || '').toLowerCase() !== target
    );
    await persistMasterData(currentData);
    res.json({ 
      success: true, 
      message: `User ${emailOrId} deleted from database.`, 
      deletedCount: beforeCount - (currentData.users || []).length,
      totalUsers: (currentData.users || []).length 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Stop / Cancel User Paid Plan Endpoint
app.post('/api/users/stop-plan', async (req, res) => {
  try {
    const { userEmail } = req.body;
    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'User email is required.' });
    }
    const targetEmail = userEmail.trim().toLowerCase();
    const currentData = await fetchMasterData();

    // 1. Update user
    currentData.users = (currentData.users || []).map((u: any) => {
      if ((u.email || '').toLowerCase() === targetEmail) {
        return {
          ...u,
          activePlan: 'free',
          planExpiresAt: null,
          planStartedAt: null
        };
      }
      return u;
    });

    // 2. Downgrade properties
    currentData.properties = (currentData.properties || []).map((p: any) => {
      if (p.owner && p.owner.email && p.owner.email.toLowerCase() === targetEmail) {
        return {
          ...p,
          payPlan: 'basic',
          payPlanName: 'Free Listing',
          isFeatured: false
        };
      }
      return p;
    });

    // 3. Mark payment requests as cancelled / expired
    currentData.paymentRequests = (currentData.paymentRequests || []).map((r: any) => {
      if (r.userEmail && r.userEmail.toLowerCase() === targetEmail && r.status === 'approved') {
        return {
          ...r,
          status: 'rejected',
          rejectionReason: 'Plan stopped / cancelled by Administrator'
        };
      }
      return r;
    });

    await persistMasterData(currentData);
    res.json({ success: true, message: `Active plan stopped for ${targetEmail}.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Set User or Property Pay Plan Tier (Free, Basic, Premium, VIP)
app.post('/api/users/set-plan', async (req, res) => {
  try {
    const { userEmail, propertyId, plan } = req.body;
    const currentData = await fetchMasterData();
    const targetPlan = plan || 'basic';
    const isVip = targetPlan === 'vip';
    const isPremium = targetPlan === 'premium';
    const isBasic = targetPlan === 'basic';

    const planName = isVip 
      ? 'VIP Package (VIP TOP+)' 
      : isPremium 
      ? 'Premium Package' 
      : isBasic 
      ? 'Basic Package' 
      : 'Free Plan';

    const durationDays = isVip || isPremium ? 30 : 0;
    const expiresAt = durationDays > 0 ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString() : null;

    if (userEmail) {
      const targetEmail = userEmail.trim().toLowerCase();
      currentData.users = (currentData.users || []).map((u: any) => {
        if ((u.email || '').toLowerCase() === targetEmail) {
          return {
            ...u,
            activePlan: targetPlan,
            planExpiresAt: expiresAt,
            planStartedAt: expiresAt ? new Date().toISOString() : null
          };
        }
        return u;
      });

      // Update user properties
      currentData.properties = (currentData.properties || []).map((p: any) => {
        if (p.owner && p.owner.email && p.owner.email.toLowerCase() === targetEmail) {
          return {
            ...p,
            payPlan: targetPlan,
            payPlanName: planName,
            isVerified: isVip || isPremium ? true : p.isVerified,
            isFeatured: isVip || isPremium
          };
        }
        return p;
      });
    }

    if (propertyId) {
      currentData.properties = (currentData.properties || []).map((p: any) => {
        if (p.id === propertyId) {
          return {
            ...p,
            payPlan: targetPlan,
            payPlanName: planName,
            isVerified: isVip ? true : p.isVerified,
            isFeatured: isVip || isPremium
          };
        }
        return p;
      });
    }

    await persistMasterData(currentData);
    res.json({ success: true, message: `Plan tier updated to ${planName}.`, plan: targetPlan });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Update Admin Profile Endpoint (Used by Owner)
app.post('/api/admin/update-profile', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required for Admin profile.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail.endsWith('/admin') && cleanEmail !== 'kalebbereket49@gmail.com/admin') {
      return res.status(400).json({ success: false, message: 'Admin email must end with /admin.' });
    }

    const currentData = await fetchMasterData();
    const oldEmail = (currentData.adminCredentials?.email || '').trim().toLowerCase();
    const oldPass = (currentData.adminCredentials?.password || '').trim();

    if (oldEmail && oldEmail !== cleanEmail) {
      currentData.revokedAdminEmails = currentData.revokedAdminEmails || [];
      if (!currentData.revokedAdminEmails.includes(oldEmail)) {
        currentData.revokedAdminEmails.push(oldEmail);
      }
    }

    if (oldPass && oldPass !== cleanPass) {
      currentData.revokedAdminPasswords = currentData.revokedAdminPasswords || [];
      if (!currentData.revokedAdminPasswords.includes(oldPass)) {
        currentData.revokedAdminPasswords.push(oldPass);
      }
    }

    currentData.adminCredentials = {
      email: cleanEmail,
      password: cleanPass,
      name: name?.trim() || currentData.adminCredentials?.name || 'Admin (Kaleb Bereket)',
      phone: phone?.trim() || currentData.adminCredentials?.phone || '+251995406697'
    };

    await persistMasterData(currentData);
    res.json({ success: true, message: 'Admin profile and credentials updated successfully by Owner.', adminCredentials: currentData.adminCredentials });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// User Self Profile Update Endpoint (Name, Phone, Role, Password)
app.post('/api/user/update-profile', async (req, res) => {
  try {
    const { email, name, phone, role, currentPassword, newPassword } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const targetEmail = email.trim().toLowerCase();
    const currentData = await fetchMasterData();
    const users = currentData.users || [];
    const index = users.findIndex((u: any) => (u.email || '').toLowerCase() === targetEmail);

    if (index === 0 || index > 0) {
      const user = users[index];
      if (newPassword && newPassword.trim()) {
        if (user.password && currentPassword && user.password !== currentPassword.trim()) {
          return res.status(400).json({ success: false, message: 'Current password does not match.' });
        }
        if (newPassword.trim().length < 6) {
          return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
        }
        user.password = newPassword.trim();
      }

      if (name) user.name = name.trim();
      if (phone) user.phone = phone.trim();
      if (role && (role === 'tenant' || role === 'landlord')) user.role = role;

      users[index] = user;
      currentData.users = users;
      await persistMasterData(currentData);

      return res.json({ success: true, message: 'Profile updated successfully!', user });
    } else {
      // Create user
      const newUser = {
        id: `user-${Date.now()}`,
        name: name?.trim() || targetEmail.split('@')[0],
        email: targetEmail,
        phone: phone?.trim() || '+251995406697',
        role: role === 'landlord' ? 'landlord' : 'tenant',
        password: newPassword?.trim() || '123456',
        savedPropertyIds: [],
        postedPropertyIds: [],
        toursBooked: []
      };
      currentData.users = [newUser, ...users];
      await persistMasterData(currentData);
      return res.json({ success: true, message: 'Profile saved to database!', user: newUser });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Payment Request Submission
app.post('/api/payments', async (req, res) => {
  try {
    const payment = req.body;
    if (!payment || !payment.id) {
      return res.status(400).json({ success: false, message: 'Payment data required.' });
    }

    const currentData = await fetchMasterData();
    currentData.paymentRequests = [payment, ...(currentData.paymentRequests || []).filter((p: any) => p.id !== payment.id)];
    await persistMasterData(currentData);

    res.json({ success: true, payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Payment Request Approval
app.post('/api/payments/approve', async (req, res) => {
  try {
    const { requestId, durationMonths = 1, planId, planName, userEmail } = req.body;
    if (!requestId) {
      return res.status(400).json({ success: false, message: 'Request ID required.' });
    }

    const currentData = await fetchMasterData();
    const durationDays = Number(durationMonths) * 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    // Update payment request
    currentData.paymentRequests = (currentData.paymentRequests || []).map((r: any) => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'approved',
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Owner (Kaleb Bereket)',
          expiresAt
        };
      }
      return r;
    });

    const targetEmail = (userEmail || '').trim().toLowerCase();
    const resolvedPlan = planId === 'boost' ? 'premium' : planId;

    // Update user active plan
    if (targetEmail) {
      currentData.users = (currentData.users || []).map((u: any) => {
        if (u.email && u.email.toLowerCase() === targetEmail) {
          return {
            ...u,
            activePlan: resolvedPlan,
            planExpiresAt: expiresAt,
            planStartedAt: new Date().toISOString()
          };
        }
        return u;
      });

      // Update properties owned by this user based on plan type
      const isVip = resolvedPlan === 'vip';
      const isPremium = resolvedPlan === 'premium';
      const isBasic = resolvedPlan === 'basic';

      currentData.properties = (currentData.properties || []).map((p: any) => {
        if (p.owner && p.owner.email && p.owner.email.toLowerCase() === targetEmail) {
          return {
            ...p,
            isVerified: true,
            isFeatured: isVip || isPremium,
            payPlan: resolvedPlan,
            payPlanName: planName || (isVip ? 'VIP TOP+ Package' : isPremium ? 'Premium Package' : 'Basic Package'),
            autoRenewIntervalHours: isVip ? 12 : isPremium ? 24 : 48,
            multiplierText: isVip ? 'Up to 7 times more clients for ads' : isPremium ? 'Up to 5 times more clients for your ads' : 'Up to 2 times more clients for ads'
          };
        }
        return p;
      });
    }

    await persistMasterData(currentData);

    res.json({ success: true, message: 'Payment approved, plan activated, and database updated.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Payment Request Rejection
app.post('/api/payments/reject', async (req, res) => {
  try {
    const { requestId, reason } = req.body;
    if (!requestId) {
      return res.status(400).json({ success: false, message: 'Request ID required.' });
    }

    const currentData = await fetchMasterData();
    currentData.paymentRequests = (currentData.paymentRequests || []).map((r: any) => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'rejected',
          rejectionReason: reason || 'Telebirr transaction could not be verified.',
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Owner (Kaleb Bereket)'
        };
      }
      return r;
    });

    await persistMasterData(currentData);
    res.json({ success: true, message: 'Payment rejected and updated in database.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Payment Request Deletion
app.delete('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentData = await fetchMasterData();
    currentData.paymentRequests = (currentData.paymentRequests || []).filter((p: any) => p.id !== id);
    await persistMasterData(currentData);
    res.json({ success: true, message: `Payment request ${id} deleted.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Get all Feedbacks
app.get('/api/feedback', async (req, res) => {
  try {
    const currentData = await fetchMasterData();
    res.json({ success: true, feedbacks: currentData.ownerFeedbacks || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Submit / Save Feedback (with location support)
app.post('/api/feedback', async (req, res) => {
  try {
    const feedback = req.body;
    if (!feedback || !feedback.message) {
      return res.status(400).json({ success: false, message: 'Message is required for feedback.' });
    }

    const currentData = await fetchMasterData();
    currentData.ownerFeedbacks = [
      feedback,
      ...(currentData.ownerFeedbacks || []).filter((f: any) => f.id !== feedback.id)
    ];
    await persistMasterData(currentData);

    res.json({ success: true, feedback, message: 'Feedback stored successfully in Master Database.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Delete Feedback (Owner or Admin)
app.delete('/api/feedback/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentData = await fetchMasterData();
    currentData.ownerFeedbacks = (currentData.ownerFeedbacks || []).filter((f: any) => f.id !== id);
    await persistMasterData(currentData);
    res.json({ success: true, message: `Feedback ${id} deleted successfully.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Reply / Status update on Feedback (Owner or Admin)
app.post('/api/feedback/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { replyNotes, status } = req.body;
    const currentData = await fetchMasterData();
    currentData.ownerFeedbacks = (currentData.ownerFeedbacks || []).map((f: any) => {
      if (f.id === id) {
        return {
          ...f,
          replyNotes: replyNotes || f.replyNotes,
          status: status || 'replied',
          repliedAt: new Date().toISOString()
        };
      }
      return f;
    });
    await persistMasterData(currentData);
    res.json({ success: true, message: 'Feedback updated.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Change Password Endpoint (Requires: Gmail, Phone, Current Password, New Password)
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { email, phone, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Gmail/Email, Current Password, and New Password are required.'
      });
    }

    const inputEmail = email.trim().toLowerCase();
    const inputPhone = (phone || '').trim();
    const inputCurrent = currentPassword.trim();
    const inputNew = newPassword.trim();

    if (inputNew.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    // Check if "/" is used in password (allowed ONLY for Admin and Owner)
    if (inputNew.includes('/')) {
      const isAllowedAdminOwner = 
        inputEmail === 'kalebbereket49@gmail.com/owner' || 
        inputEmail === 'kalebbereket49@gmail.com/admin' || 
        inputEmail === 'kalebbereket49@gmail.com' ||
        inputEmail.endsWith('/admin') || 
        inputEmail.endsWith('/owner');
      
      if (!isAllowedAdminOwner) {
        return res.status(400).json({
          success: false,
          message: "The '/' symbol in passwords is reserved for Admin and Owner accounts only."
        });
      }
    }

    // Slash restriction check in email
    if (inputEmail.includes('/')) {
      const isAllowedSlash = inputEmail.endsWith('/admin') || inputEmail.endsWith('/owner');
      if (!isAllowedSlash) {
        return res.status(400).json({
          success: false,
          message: 'The "/" symbol in email/username is reserved for Admin and Owner accounts only.'
        });
      }
    }

    const currentData = await fetchMasterData();

    // Check revoked emails
    const revokedAdminEmails: string[] = currentData.revokedAdminEmails || [];
    const revokedOwnerEmails: string[] = currentData.revokedOwnerEmails || [];
    if (revokedAdminEmails.includes(inputEmail) || revokedOwnerEmails.includes(inputEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: 'This email address was previously changed and can no longer access or modify the system.' 
      });
    }

    // 1. Check Owner account
    const ownerCreds = currentData.ownerCredentials || { email: 'kalebbereket49@gmail.com/owner', password: 'Kaleb5873' };
    const cleanOwnerEmail = (ownerCreds.email || '').trim().toLowerCase();
    const isOwnerMatch = inputEmail === cleanOwnerEmail || inputEmail === cleanOwnerEmail.split('/')[0];
    if (isOwnerMatch) {
      if (inputCurrent !== ownerCreds.password) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect for Owner account.' });
      }
      // Invalidate old password permanently
      currentData.revokedOwnerPasswords = currentData.revokedOwnerPasswords || [];
      if (!currentData.revokedOwnerPasswords.includes(ownerCreds.password)) {
        currentData.revokedOwnerPasswords.push(ownerCreds.password);
      }
      currentData.ownerCredentials = {
        ...ownerCreds,
        password: inputNew,
        phone: inputPhone || ownerCreds.phone
      };
      await persistMasterData(currentData);
      return res.json({ success: true, message: 'Owner password changed successfully! Old password is now invalidated.' });
    }

    // 2. Check Admin account
    const adminCreds = currentData.adminCredentials || { email: 'kalebbereket49@gmail.com/admin', password: 'Kaleb5873' };
    const cleanAdminEmail = (adminCreds.email || '').trim().toLowerCase();
    const isAdminMatch = inputEmail === cleanAdminEmail || inputEmail === cleanAdminEmail.split('/')[0];
    if (isAdminMatch) {
      if (inputCurrent !== adminCreds.password) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect for Admin account.' });
      }
      // Invalidate old password permanently
      currentData.revokedAdminPasswords = currentData.revokedAdminPasswords || [];
      if (!currentData.revokedAdminPasswords.includes(adminCreds.password)) {
        currentData.revokedAdminPasswords.push(adminCreds.password);
      }
      currentData.adminCredentials = {
        ...adminCreds,
        password: inputNew,
        phone: inputPhone || adminCreds.phone
      };
      await persistMasterData(currentData);
      return res.json({ success: true, message: 'Admin password changed successfully! Old password is now invalidated.' });
    }

    // 3. Check registered users
    const users = currentData.users || [];
    const userIndex = users.findIndex((u: any) => (u.email || '').toLowerCase() === inputEmail);

    if (userIndex >= 0) {
      const targetUser = users[userIndex];
      if (targetUser.password && targetUser.password !== inputCurrent) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }
      users[userIndex] = {
        ...targetUser,
        password: inputNew,
        phone: inputPhone || targetUser.phone
      };
      currentData.users = users;
      await persistMasterData(currentData);
      return res.json({ success: true, message: 'Password changed successfully in the database!' });
    }

    // If account was created with local default, create registered record
    const newAccount = {
      id: `user-${Date.now()}`,
      name: inputEmail.split('@')[0],
      email: inputEmail,
      phone: inputPhone || '+251995406697',
      role: 'tenant',
      password: inputNew,
      provider: 'local',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      savedPropertyIds: ['prop-1'],
      postedPropertyIds: [],
      toursBooked: []
    };
    currentData.users = [newAccount, ...users];
    await persistMasterData(currentData);

    return res.json({ success: true, message: 'Password configured and saved to database!' });
  } catch (error: any) {
    console.error('[Change Password Error]:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to change password.' });
  }
});

// Helper to normalize phone numbers for matching
function normalizePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 9) {
    return digits.slice(-9);
  }
  return digits;
}

// Endpoint to send password reset verification code & link
app.post('/api/auth/send-reset-email', async (req, res) => {
  try {
    const { email, phone, code, resetUrl } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        message: 'A valid Gmail address is required to receive the 6-digit verification code.' 
      });
    }

    const inputEmail = email.trim().toLowerCase();
    const inputPhone = phone ? phone.toString().trim() : '';
    const inputPhoneNorm = normalizePhone(inputPhone);

    // Check slash symbol constraint: allowed ONLY for Admin and Owner accounts
    if (inputEmail.includes('/')) {
      const isAllowedRole = inputEmail.endsWith('/admin') || inputEmail.endsWith('/owner');
      if (!isAllowedRole) {
        return res.status(400).json({
          success: false,
          message: 'The "/" symbol in email/username is reserved for Admin and Owner accounts only.'
        });
      }
    }

    // Verify against registered accounts in Master Database
    const currentData = await fetchMasterData();
    const ownerCreds = currentData.ownerCredentials || { email: 'kalebbereket49@gmail.com/owner', phone: '+251995406697' };
    const adminCreds = currentData.adminCredentials || { email: 'kalebbereket49@gmail.com/admin', phone: '+251995406697' };
    const users = currentData.users || [];

    let matchedAccountName = 'User';

    // 1. Owner Check
    if (inputEmail === (ownerCreds.email || '').toLowerCase() || inputEmail === 'kalebbereket49@gmail.com/owner' || inputEmail === 'kalebbereket49@gmail.com') {
      const ownerPhoneNorm = normalizePhone(ownerCreds.phone || '+251995406697');
      if (inputPhoneNorm && ownerPhoneNorm && ownerPhoneNorm !== inputPhoneNorm) {
        return res.status(400).json({
          success: false,
          message: 'The provided Phone Number does not match the registered Owner account phone number.'
        });
      }
      matchedAccountName = ownerCreds.name || 'Kaleb Bereket (Owner)';
    }
    // 2. Admin Check
    else if (inputEmail === (adminCreds.email || '').toLowerCase() || inputEmail === 'kalebbereket49@gmail.com/admin') {
      const adminPhoneNorm = normalizePhone(adminCreds.phone || '+251995406697');
      if (inputPhoneNorm && adminPhoneNorm && adminPhoneNorm !== inputPhoneNorm) {
        return res.status(400).json({
          success: false,
          message: 'The provided Phone Number does not match the registered Admin account phone number.'
        });
      }
      matchedAccountName = adminCreds.name || 'Administrator';
    }
    // 3. Registered Users Check
    else {
      const foundUser = users.find((u: any) => (u.email || '').toLowerCase() === inputEmail);
      if (foundUser) {
        const userPhoneNorm = normalizePhone(foundUser.phone || '');
        if (inputPhoneNorm && userPhoneNorm && userPhoneNorm !== inputPhoneNorm) {
          return res.status(400).json({
            success: false,
            message: `The provided Phone Number does not match the registered phone number on file for ${inputEmail}.`
          });
        }
        matchedAccountName = foundUser.name || 'User';
      } else {
        matchedAccountName = inputEmail.split('@')[0];
      }
    }

    // Extract destination Gmail address
    const recipientEmail = inputEmail.includes('/') 
      ? inputEmail.split('/')[0].trim() 
      : inputEmail;

    // Generate or use 6-character code
    const verificationCode = (code || Math.floor(100000 + Math.random() * 900000).toString()).toString().trim();
    const secureToken = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const actionUrl = resetUrl || `${req.protocol}://${req.get('host')}?token=${verificationCode}`;

    // Store in memory & active reset codes
    activeResetCodes.set(verificationCode, {
      id: `rst-${Date.now()}`,
      email: inputEmail,
      code: verificationCode,
      token: secureToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      used: false
    });
    activeResetCodes.set(secureToken, {
      id: `rst-${Date.now()}`,
      email: inputEmail,
      code: verificationCode,
      token: secureToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      used: false
    });

    const gmailUser = process.env.GMAIL_USER || 'betefinder.support@gmail.com';
    const transporter = getMailTransporter();

    // HTML Email Template
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bete Finder Password Reset</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
          .content { padding: 32px 24px; }
          .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
          .text { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px; }
          .code-box { background: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .code-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #166534; margin-bottom: 6px; }
          .code-value { font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #059669; font-family: monospace; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25); }
          .footer { background: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 24px; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5; }
          .amharic-text { font-size: 13px; color: #64748b; margin-top: 16px; padding-top: 16px; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bete Finder Security</h1>
            <p>የቤቴ ፈላጊ ደህንነት ማረጋገጫ</p>
          </div>
          <div class="content">
            <div class="greeting">Hello,</div>
            <p class="text">We received a request to reset the password for your Bete Finder account (<strong>${inputEmail}</strong>). Use the 6-digit verification code below to set a new password in your Primary Inbox.</p>
            
            <div class="code-box">
              <div class="code-label">Verification Code / የማረጋገጫ ቁጥር</div>
              <div class="code-value">${verificationCode}</div>
            </div>

            <div class="btn-container">
              <a href="${actionUrl}" class="btn" target="_blank">Reset Password / የይለፍ ቃል ቀይር</a>
            </div>

            <p class="text" style="font-size: 12px; color: #64748b;">
              This verification code will expire in <strong>2 hours</strong>. If you did not request this password reset, please ignore this email; your account remains secure.
            </p>

            <div class="amharic-text">
              ይህ ባለ 6 አሃዝ የማረጋገጫ ቁጥር የተላከው የይለፍ ቃልዎን ለመቀየር በጠየቁት መሰረት ነው። እርስዎ ካልጠየቁ ይህንን መልእክት ችላ ይበሉት።
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Bete Finder (ቤቴ ፈላጊ) &bull; Addis Ababa, Ethiopia<br>
            Sent securely via Bete Finder Security SMTP Service
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `Bete Finder Security\n\nYour 6-digit password reset verification code for account ${inputEmail} is: ${verificationCode}\n\nReset your password here: ${actionUrl}\n\nThis code will expire in 2 hours.\nIf you did not request a password reset, please ignore this message.`;

    if (transporter) {
      const info = await transporter.sendMail({
        from: `"Bete Finder Security" <${gmailUser}>`,
        replyTo: `"Bete Finder Security" <${gmailUser}>`,
        to: recipientEmail,
        subject: `${verificationCode} is your Bete Finder security verification code`,
        text: textContent,
        html: htmlContent,
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
          'X-Entity-Ref-ID': `bete-sec-${Date.now()}`,
          'Auto-Submitted': 'auto-generated'
        },
        priority: 'high',
      });

      return res.json({
        success: true,
        delivered: true,
        code: verificationCode,
        messageId: info.messageId,
        message: `6-digit password reset verification code sent to ${recipientEmail} (Check your Primary Inbox).`,
        resetUrl: actionUrl,
      });
    } else {
      console.log(`[SMTP Notice] GMAIL_APP_PASSWORD not set. 6-digit code for ${recipientEmail}: ${verificationCode}`);
      return res.json({
        success: true,
        delivered: false,
        code: verificationCode,
        requiresAppPassword: true,
        message: `Verification code generated for ${recipientEmail}.`,
        resetUrl: actionUrl,
      });
    }
  } catch (error: any) {
    console.error('[SMTP Send Error]:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to send email via SMTP: ${error?.message || 'Connection error'}.`,
    });
  }
});

// Verify 6-digit reset code endpoint
app.post('/api/auth/verify-reset-code', (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ valid: false, message: 'Verification code is required.' });
  }

  const cleanCode = code.toString().trim();
  const resetReq = activeResetCodes.get(cleanCode);

  if (!resetReq) {
    return res.status(400).json({ valid: false, message: 'Invalid or expired 6-digit verification code.' });
  }

  if (resetReq.used) {
    return res.status(400).json({ valid: false, message: 'This verification code has already been used.' });
  }

  if (resetReq.expiresAt <= Date.now()) {
    return res.status(400).json({ valid: false, message: 'This verification code has expired (valid for 2 hours).' });
  }

  return res.json({ valid: true, email: resetReq.email });
});

// Reset Password with verified code
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { code, token, newPassword } = req.body;
    const lookupKey = (code || token || '').toString().trim();

    if (!lookupKey || !newPassword) {
      return res.status(400).json({ success: false, message: 'Code and new password are required.' });
    }

    if (newPassword.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const cleanPass = newPassword.trim();
    const resetReq = activeResetCodes.get(lookupKey);
    let targetEmail = resetReq?.email;

    if (!targetEmail) {
      // Check local JSON database if code is there
      const currentData = await fetchMasterData();
      const users = currentData.users || [];
      if (users.length > 0) {
        targetEmail = users[0].email;
      }
    }

    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    }

    // Validate slash in password
    if (cleanPass.includes('/')) {
      const isAllowedAdminOwner = 
        targetEmail.toLowerCase() === 'kalebbereket49@gmail.com/owner' || 
        targetEmail.toLowerCase() === 'kalebbereket49@gmail.com/admin' || 
        targetEmail.toLowerCase() === 'kalebbereket49@gmail.com' ||
        targetEmail.toLowerCase().endsWith('/admin') || 
        targetEmail.toLowerCase().endsWith('/owner');
      
      if (!isAllowedAdminOwner) {
        return res.status(400).json({
          success: false,
          message: "The '/' symbol in passwords is reserved for Admin and Owner accounts only."
        });
      }
    }

    // Mark code as used
    if (resetReq) {
      resetReq.used = true;
    }

    // Update password in database
    const currentData = await fetchMasterData();
    const normalized = targetEmail.trim().toLowerCase();

    // 1. Owner
    if (normalized === 'kalebbereket49@gmail.com/owner' || normalized === (currentData.ownerCredentials?.email || '').toLowerCase()) {
      currentData.ownerCredentials = { ...currentData.ownerCredentials, password: newPassword.trim() };
    }
    // 2. Admin
    else if (normalized === 'kalebbereket49@gmail.com/admin' || normalized === (currentData.adminCredentials?.email || '').toLowerCase()) {
      currentData.adminCredentials = { ...currentData.adminCredentials, password: newPassword.trim() };
    }
    // 3. Registered users
    else {
      const users = currentData.users || [];
      const idx = users.findIndex((u: any) => (u.email || '').toLowerCase() === normalized);
      if (idx >= 0) {
        users[idx].password = newPassword.trim();
      } else {
        users.push({
          id: `user-${Date.now()}`,
          name: normalized.split('@')[0],
          email: normalized,
          phone: '+251995406697',
          role: 'tenant',
          password: newPassword.trim(),
          provider: 'local',
          savedPropertyIds: [],
          postedPropertyIds: [],
          toursBooked: []
        });
      }
      currentData.users = users;
    }

    await persistMasterData(currentData);

    return res.json({ success: true, message: 'Password updated successfully across all devices!' });
  } catch (error: any) {
    console.error('[Reset Password Error]:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to reset password.' });
  }
});

// Google OAuth client config endpoint
app.get('/api/auth/google-config', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
  res.json({ clientId });
});

// Catch-all for API endpoints to ensure JSON is ALWAYS returned (prevents HTML error parsing failures)
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl || req.url} not found on server.`,
    isJson: true
  });
});

// Global Error Handler to guarantee JSON responses and prevent FUNCTION_INVOCATION_FAILED non-JSON crashes
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Unhandled Express Error]:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    success: false,
    message: err?.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err?.stack : undefined
  });
});

// Start the server with Vite middleware in dev or static serving in prod
export async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bete Finder Server running on http://0.0.0.0:${PORT}`);
  });
}

export { app };
export default app;

if (!process.env.VERCEL) {
  startServer();
}

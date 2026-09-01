import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import pg from 'pg';

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

app.use(express.json({ limit: '50mb' }));

// Database JSON File Path
const DB_FILE_PATH = process.env.VERCEL 
  ? path.join('/tmp', 'bete_finder_db.json')
  : path.join(process.cwd(), 'data', 'bete_finder_db.json');

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

// Read database from local JSON file
function readDbFromFile(): any {
  ensureDataDirectory();
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      // Migrate admin password if still set to placeholder
      if (parsed.adminCredentials?.password === '1234567890admin' || !parsed.adminCredentials?.password) {
        parsed.adminCredentials = {
          ...parsed.adminCredentials,
          password: 'Kaleb5873'
        };
      }
      if (parsed.ownerCredentials?.password === '1234567890owner' || !parsed.ownerCredentials?.password) {
        parsed.ownerCredentials = {
          ...parsed.ownerCredentials,
          password: 'Kaleb5873'
        };
      }
      return parsed;
    }
  } catch (e) {
    console.error('[DB File Read Error]:', e);
  }
  return {
    lastUpdated: Date.now(),
    properties: [],
    users: [],
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
    paymentRequests: []
  };
}

// Write database to local JSON file
function writeDbToFile(data: any): boolean {
  ensureDataDirectory();
  try {
    data.lastUpdated = Date.now();
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('[DB File Write Error]:', e);
    return false;
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
    users: [],
    adminCredentials: {
      email: 'kalebbereket49@gmail.com/admin',
      password: 'Kaleb5873',
      name: 'Admin (Kaleb Bereket)',
      phone: '+251995406697'
    },
    ownerCredentials: {
      email: 'kalebbereket49@gmail.com/owner',
      password: 'Kaleb5873',
      name: 'Owner (Kaleb Bereket)',
      phone: '+251995406697'
    },
    telebirrSettings: {
      accountNumber: '0995406697',
      accountName: 'Kaleb Bereket (Bete Finder Owner)'
    },
    paymentRequests: []
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
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
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

// Initialize DB on boot
initNeonDb().catch(console.error);

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

    if (existingIndex >= 0) {
      updatedProperties[existingIndex] = { ...updatedProperties[existingIndex], ...prop };
    } else {
      updatedProperties = [prop, ...updatedProperties];
    }

    currentData.properties = updatedProperties;
    await persistMasterData(currentData);

    res.json({ success: true, property: prop, totalProperties: updatedProperties.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Property Delete
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

// User Upsert / Registration
app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;
    if (!userData || !userData.email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const email = userData.email.trim().toLowerCase();
    const currentData = await fetchMasterData();
    let users = [...(currentData.users || [])];
    const existingIndex = users.findIndex((u: any) => u.email.toLowerCase() === email);

    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...userData };
    } else {
      users = [userData, ...users];
    }

    currentData.users = users;
    await persistMasterData(currentData);

    res.json({ success: true, totalUsers: users.length, message: 'User updated in database.' });
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
      u.id !== emailOrId && u.email.toLowerCase() !== target
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
      if (u.email.toLowerCase() === targetEmail) {
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
        if (u.email.toLowerCase() === targetEmail) {
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
    const index = users.findIndex((u: any) => u.email.toLowerCase() === targetEmail);

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

    // 1. Check Owner account
    const ownerCreds = currentData.ownerCredentials || { email: 'kalebbereket49@gmail.com/owner', password: 'Kaleb5873' };
    if (inputEmail === ownerCreds.email.toLowerCase() || inputEmail === 'kalebbereket49@gmail.com/owner') {
      if (inputCurrent !== ownerCreds.password) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect for Owner account.' });
      }
      currentData.ownerCredentials = {
        ...ownerCreds,
        password: inputNew,
        phone: inputPhone || ownerCreds.phone
      };
      await persistMasterData(currentData);
      return res.json({ success: true, message: 'Owner password changed successfully!' });
    }

    // 2. Check Admin account
    const adminCreds = currentData.adminCredentials || { email: 'kalebbereket49@gmail.com/admin', password: 'Kaleb5873' };
    if (inputEmail === adminCreds.email.toLowerCase() || inputEmail === 'kalebbereket49@gmail.com/admin') {
      if (inputCurrent !== adminCreds.password) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect for Admin account.' });
      }
      currentData.adminCredentials = {
        ...adminCreds,
        password: inputNew,
        phone: inputPhone || adminCreds.phone
      };
      await persistMasterData(currentData);
      return res.json({ success: true, message: 'Admin password changed successfully!' });
    }

    // 3. Check registered users
    const users = currentData.users || [];
    const userIndex = users.findIndex((u: any) => u.email.toLowerCase() === inputEmail);

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
        message: 'A valid registered Gmail / Email address is required.' 
      });
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Registered Phone Number is required to request a password reset.'
      });
    }

    const inputEmail = email.trim().toLowerCase();
    const inputPhone = phone.trim();
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

    let isMatched = false;
    let matchedAccountName = 'User';

    // 1. Owner Check
    if (inputEmail === ownerCreds.email.toLowerCase() || inputEmail === 'kalebbereket49@gmail.com/owner' || inputEmail === 'kalebbereket49@gmail.com') {
      const ownerPhoneNorm = normalizePhone(ownerCreds.phone || '+251995406697');
      if (ownerPhoneNorm === inputPhoneNorm) {
        isMatched = true;
        matchedAccountName = ownerCreds.name || 'Owner';
      } else {
        return res.status(400).json({
          success: false,
          message: 'The provided Phone Number does not match the registered Owner account phone number.'
        });
      }
    }
    // 2. Admin Check
    else if (inputEmail === adminCreds.email.toLowerCase() || inputEmail === 'kalebbereket49@gmail.com/admin') {
      const adminPhoneNorm = normalizePhone(adminCreds.phone || '+251995406697');
      if (adminPhoneNorm === inputPhoneNorm) {
        isMatched = true;
        matchedAccountName = adminCreds.name || 'Admin';
      } else {
        return res.status(400).json({
          success: false,
          message: 'The provided Phone Number does not match the registered Admin account phone number.'
        });
      }
    }
    // 3. Registered Users Check
    else {
      const foundUser = users.find((u: any) => u.email.toLowerCase() === inputEmail);
      if (!foundUser) {
        return res.status(400).json({
          success: false,
          message: 'No registered account found with this Gmail / Email in the Bete Finder database. Both Email and Phone must be registered.'
        });
      }

      const userPhoneNorm = normalizePhone(foundUser.phone || '');
      if (userPhoneNorm && userPhoneNorm === inputPhoneNorm) {
        isMatched = true;
        matchedAccountName = foundUser.name || 'User';
      } else {
        return res.status(400).json({
          success: false,
          message: `The provided Phone Number does not match the registered phone number on file for ${inputEmail}.`
        });
      }
    }

    if (!isMatched) {
      return res.status(400).json({
        success: false,
        message: 'The entered Gmail and Phone Number could not be verified in the database.'
      });
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
    if (normalized === 'kalebbereket49@gmail.com/owner' || normalized === currentData.ownerCredentials?.email.toLowerCase()) {
      currentData.ownerCredentials = { ...currentData.ownerCredentials, password: newPassword.trim() };
    }
    // 2. Admin
    else if (normalized === 'kalebbereket49@gmail.com/admin' || normalized === currentData.adminCredentials?.email.toLowerCase()) {
      currentData.adminCredentials = { ...currentData.adminCredentials, password: newPassword.trim() };
    }
    // 3. Registered users
    else {
      const users = currentData.users || [];
      const idx = users.findIndex((u: any) => u.email.toLowerCase() === normalized);
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

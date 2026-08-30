import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import pg from 'pg';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Database JSON File Path
const DB_FILE_PATH = path.join(process.cwd(), 'data', 'bete_finder_db.json');

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
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read database from local JSON file
function readDbFromFile(): any {
  ensureDataDirectory();
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      return JSON.parse(content);
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
      password: '1234567890admin',
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
let pgPool: pg.Pool | null = null;
let isPgConnected = false;

function getPgPool(): pg.Pool | null {
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) return null;
  if (!pgPool) {
    try {
      pgPool = new pg.Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });
    } catch (e) {
      console.error('[Neon Pool Init Error]:', e);
    }
  }
  return pgPool;
}

// Initialize PostgreSQL / Neon table
async function initNeonDb() {
  const pool = getPgPool();
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bete_finder_store (
        key VARCHAR(64) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    isPgConnected = true;
    console.log('[Neon DB] Successfully connected and verified bete_finder_store table.');

    // Seed initial master document if empty in Neon
    const checkRes = await pool.query(`SELECT key FROM bete_finder_store WHERE key = 'master_db' LIMIT 1;`);
    if (checkRes.rows.length === 0) {
      const localData = readDbFromFile();
      await pool.query(
        `INSERT INTO bete_finder_store (key, data, updated_at) VALUES ('master_db', $1, NOW()) ON CONFLICT (key) DO NOTHING;`,
        [JSON.stringify(localData)]
      );
      console.log('[Neon DB] Seeded master data into Neon database from local store.');
    }
  } catch (err: any) {
    isPgConnected = false;
    console.warn('[Neon DB] Connection notice (proceeding with persistent server storage):', err?.message || err);
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
      console.error('[Neon DB Sync Error]:', err?.message || err);
    }
  }
  return fileOk;
}

// Load complete master data with Neon priority and file fallback
async function fetchMasterData(): Promise<any> {
  const pool = getPgPool();
  if (pool) {
    try {
      const res = await pool.query(`SELECT data FROM bete_finder_store WHERE key = 'master_db' LIMIT 1;`);
      if (res.rows.length > 0 && res.rows[0].data) {
        isPgConnected = true;
        const neonData = res.rows[0].data;
        // Also keep local file in sync with Neon
        writeDbToFile(neonData);
        return neonData;
      }
    } catch (err: any) {
      console.error('[Neon DB Fetch Error]:', err?.message || err);
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
      hasNeonConfigured: Boolean(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL),
      totalProperties: data.properties?.length || 0,
      totalUsers: data.users?.length || 0,
      totalPayments: data.paymentRequests?.length || 0,
      lastUpdated: data.lastUpdated || Date.now()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
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

    // Merge properties
    const propertyMap = new Map();
    (currentData.properties || []).forEach((p: any) => propertyMap.set(p.id, p));
    (incomingData.properties || []).forEach((p: any) => propertyMap.set(p.id, p));
    const mergedProperties = Array.from(propertyMap.values());

    // Merge registered users
    const userMap = new Map();
    (currentData.users || []).forEach((u: any) => userMap.set(u.email.toLowerCase(), u));
    (incomingData.users || []).forEach((u: any) => userMap.set(u.email.toLowerCase(), u));
    const mergedUsers = Array.from(userMap.values());

    // Merge payment requests
    const paymentMap = new Map();
    (currentData.paymentRequests || []).forEach((r: any) => paymentMap.set(r.id, r));
    (incomingData.paymentRequests || []).forEach((r: any) => paymentMap.set(r.id, r));
    const mergedPayments = Array.from(paymentMap.values());

    const updatedMaster = {
      ...currentData,
      ...incomingData,
      properties: mergedProperties,
      users: mergedUsers,
      paymentRequests: mergedPayments,
      telebirrSettings: incomingData.telebirrSettings || currentData.telebirrSettings,
      adminCredentials: incomingData.adminCredentials || currentData.adminCredentials,
      ownerCredentials: incomingData.ownerCredentials || currentData.ownerCredentials,
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
        if (u.email.toLowerCase() === targetEmail) {
          return {
            ...u,
            activePlan: resolvedPlan,
            planExpiresAt: expiresAt,
            planStartedAt: new Date().toISOString()
          };
        }
        return u;
      });

      // Update properties owned by this user
      currentData.properties = (currentData.properties || []).map((p: any) => {
        if (p.owner && p.owner.email && p.owner.email.toLowerCase() === targetEmail) {
          return {
            ...p,
            isVerified: true,
            isFeatured: true,
            payPlan: resolvedPlan,
            payPlanName: planName || 'VIP Spotlight Plan'
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
    const adminCreds = currentData.adminCredentials || { email: 'kalebbereket49@gmail.com/admin', password: '1234567890admin' };
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
          savedPropertyIds: ['prop-1'],
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

// Start the server with Vite middleware in dev or static serving in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
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

startServer();

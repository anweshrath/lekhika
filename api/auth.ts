import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import crypto from 'crypto';

// Get admin credentials from environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'AnweshRath123!';

// Hash the secret key for password verification
const ADMIN_PASSWORD_HASH = crypto.createHash('sha256').update(ADMIN_SECRET_KEY).digest('hex');

// Session management
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: NextRequest) {
  try {
    const { action, username, password, sessionToken } = await request.json();

    switch (action) {
      case 'login':
        return await handleLogin(username, password);
      case 'logout':
        return await handleLogout(sessionToken);
      case 'verify':
        return await verifySession(sessionToken);
      case 'changePassword':
        return await changePassword(sessionToken, password);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

async function handleLogin(username: string, password: string) {
  // Verify credentials
  if (username !== ADMIN_USERNAME || !verifyPassword(password, ADMIN_PASSWORD_HASH)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Generate session token
  const sessionToken = generateSessionToken();
  const expiresAt = Date.now() + SESSION_DURATION;

  // Store session in KV
  await kv.set(`admin_session:${sessionToken}`, {
    username,
    expiresAt,
    createdAt: Date.now()
  }, { ex: 24 * 60 * 60 }); // 24 hours TTL

  // Log login attempt
  await logSecurityEvent('login', username, 'success');

  return NextResponse.json({
    success: true,
    sessionToken,
    expiresAt,
    message: 'Login successful'
  });
}

async function handleLogout(sessionToken: string) {
  if (sessionToken) {
    await kv.del(`admin_session:${sessionToken}`);
    await logSecurityEvent('logout', 'admin', 'success');
  }

  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}

async function verifySession(sessionToken: string) {
  if (!sessionToken) {
    return NextResponse.json({ error: 'No session token' }, { status: 401 });
  }

  const session = await kv.get(`admin_session:${sessionToken}`) as any;
  
  if (!session || session.expiresAt < Date.now()) {
    await kv.del(`admin_session:${sessionToken}`);
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }

  return NextResponse.json({ 
    success: true, 
    username: session.username,
    expiresAt: session.expiresAt 
  });
}

async function changePassword(sessionToken: string, newPassword: string) {
  // Verify session first
  const session = await kv.get(`admin_session:${sessionToken}`) as any;
  if (!session || session.expiresAt < Date.now()) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }

  // Hash new password
  const newPasswordHash = hashPassword(newPassword);
  
  // Store new password hash in KV (since we can't modify env vars at runtime)
  await kv.set('admin_password_hash', newPasswordHash);
  
  await logSecurityEvent('password_change', session.username, 'success');

  return NextResponse.json({ success: true, message: 'Password changed successfully' });
}

// Utility functions
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

async function logSecurityEvent(action: string, username: string, status: string) {
  const event = {
    timestamp: new Date().toISOString(),
    action,
    username,
    status,
    ip: 'admin-panel' // Could be enhanced with real IP
  };

  await kv.lpush('security_logs', JSON.stringify(event));
  await kv.ltrim('security_logs', 0, 999); // Keep last 1000 events
}

// Middleware function to verify admin access
export async function verifyAdminAccess(request: NextRequest): Promise<boolean> {
  const sessionToken = request.headers.get('x-admin-session');
  
  if (!sessionToken) {
    return false;
  }

  const session = await kv.get(`admin_session:${sessionToken}`) as any;
  return session && session.expiresAt > Date.now();
} 
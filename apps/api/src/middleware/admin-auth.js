import { timingSafeEqual } from 'crypto';

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL).trim().toLowerCase();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD);

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function parseBasicAuth(req) {
  const header = String(req.headers.authorization || '');
  if (!header.toLowerCase().startsWith('basic ')) return null;
  try {
    const decoded = Buffer.from(header.slice(6).trim(), 'base64').toString('utf-8');
    const sep = decoded.indexOf(':');
    if (sep < 0) return null;
    return {
      email: decoded.slice(0, sep).trim().toLowerCase(),
      password: decoded.slice(sep + 1),
    };
  } catch {
    return null;
  }
}

export function credentialsMatchAdmin(email, password) {
  if (!email || password === undefined) return false;
  const normalizedEmail = String(email).trim().toLowerCase();
  if (normalizedEmail !== ADMIN_EMAIL) return false;
  return safeEqual(password, ADMIN_PASSWORD);
}

export function requireAdminCredentials(req, res, next) {
  const creds = parseBasicAuth(req);
  if (!creds || !credentialsMatchAdmin(creds.email, creds.password)) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }
  req.admin = { email: creds.email };
  return next();
}

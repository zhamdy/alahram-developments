import jwt from '@tsndr/cloudflare-worker-jwt';

// ── Password hashing (PBKDF2) ──

const ITERATIONS = 100_000;
const KEY_LENGTH = 32; // bytes
const HASH_ALGO = 'SHA-256';

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);

  const hashBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: HASH_ALGO },
    keyMaterial,
    KEY_LENGTH * 8,
  );

  const saltHex = bufToHex(salt);
  const hashHex = bufToHex(new Uint8Array(hashBits));
  return `${saltHex}$${hashHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split('$');
  if (!saltHex || !hashHex) return false;

  const salt = hexToBuf(saltHex);
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);

  const hashBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: HASH_ALGO },
    keyMaterial,
    KEY_LENGTH * 8,
  );

  const computedHex = bufToHex(new Uint8Array(hashBits));
  return timingSafeEqual(computedHex, hashHex);
}

// ── JWT ──

export interface AuthPayload {
  userId: number;
  email: string;
  role: string;
}

export async function signToken(payload: AuthPayload, secret: string): Promise<string> {
  return jwt.sign({ ...payload, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 }, secret);
}

export async function verifyToken(token: string, secret: string): Promise<AuthPayload> {
  const isValid = await jwt.verify(token, secret);
  if (!isValid) throw new Error('Invalid token');
  const { payload } = jwt.decode(token);
  return payload as AuthPayload;
}

// ── Helpers ──

function bufToHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

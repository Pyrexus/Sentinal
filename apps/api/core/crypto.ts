import { timingSafeEqual } from 'node:crypto';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const base64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value: string) => Uint8Array.from(atob(value), char => char.charCodeAt(0));

export async function sha256(value: string): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashIp(ip: string, salt: string): Promise<string> {
  if (!salt || salt.length < 16) throw new Error('IP_HASH_SALT must contain at least 16 characters');
  return sha256(`${salt}\u0000${ip}`);
}

async function importEncryptionKey(secret: string) {
  const raw = fromBase64(secret);
  if (raw.length !== 32) throw new Error('DATA_ENCRYPTION_KEY must be 32 bytes encoded in base64');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptText(text: string, secret: string, version = 'v1'): Promise<string> {
  if (!/^v[1-9]\d*$/.test(version)) throw new Error('Invalid encryption key version');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(version) }, await importEncryptionKey(secret), encoder.encode(text));
  return `${version}:${base64(iv)}:${base64(new Uint8Array(ciphertext))}`;
}

export async function decryptText(ciphertext: string, keys: string | Record<string, string>): Promise<string> {
  const parts = ciphertext.split(':');
  if (parts.length !== 3 || !/^v[1-9]\d*$/.test(parts[0])) throw new Error('Invalid encrypted record');
  const [version, encodedIv, encodedValue] = parts;
  const secret = typeof keys === 'string' ? keys : keys[version];
  if (!secret) throw new Error('Unknown encryption key version');
  const iv = fromBase64(encodedIv);
  if (iv.length !== 12) throw new Error('Invalid encrypted record');
  const plain = await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:encoder.encode(version)}, await importEncryptionKey(secret), fromBase64(encodedValue));
  return decoder.decode(plain);
}

/** Hashes to fixed length before comparison so secret length is not exposed. */
export async function constantTimeEqual(left: string, right: string): Promise<boolean> {
  const [a,b] = await Promise.all([crypto.subtle.digest('SHA-256',encoder.encode(left)),crypto.subtle.digest('SHA-256',encoder.encode(right))]);
  return timingSafeEqual(new Uint8Array(a),new Uint8Array(b));
}

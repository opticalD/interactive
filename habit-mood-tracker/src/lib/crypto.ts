// End-to-end encryption helpers. The AES key is derived from the user's password
// with PBKDF2 and NEVER leaves the browser — so the server (and the project owner)
// only ever store ciphertext for sensitive fields.

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToB64(b: Uint8Array): string {
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s);
}

function b64ToBytes(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function randomSalt(): string {
  return bytesToB64(crypto.getRandomValues(new Uint8Array(16)));
}

/** Derive an AES-GCM key from a password + salt. Extractable so it can be cached locally. */
export async function deriveKey(password: string, saltB64: string): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: b64ToBytes(saltB64) as BufferSource, iterations: 150_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportKey(key: CryptoKey): Promise<string> {
  return bytesToB64(new Uint8Array(await crypto.subtle.exportKey("raw", key)));
}

export async function importKey(b64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", b64ToBytes(b64) as BufferSource, { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);
}

/** Encrypt any JSON-serialisable value → "iv.ciphertext" (both base64). */
export async function encryptJSON(value: unknown, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(value))
  );
  return `${bytesToB64(iv)}.${bytesToB64(new Uint8Array(ct))}`;
}

export async function decryptJSON<T>(payload: string, key: CryptoKey): Promise<T> {
  const [ivB64, ctB64] = payload.split(".");
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBytes(ivB64) as BufferSource },
    key,
    b64ToBytes(ctB64) as BufferSource
  );
  return JSON.parse(decoder.decode(pt)) as T;
}

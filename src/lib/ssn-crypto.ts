import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Server-only. AES-256-GCM with a key from SSN_ENCRYPTION_KEY (base64,
// 32 bytes). Stored format: enc:v1:<iv>:<authTag>:<ciphertext>, all base64.
// The version prefix lets legacy plain-text rows pass through decryptSsn
// until the one-off encryption script (scripts/encrypt-existing-ssns.ts)
// has run.

const PREFIX = "enc:v1:";

function getKey(): Buffer {
  const raw = process.env.SSN_ENCRYPTION_KEY;
  if (!raw) throw new Error("SSN_ENCRYPTION_KEY is not set");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("SSN_ENCRYPTION_KEY must be 32 bytes of base64");
  return key;
}

export function assertSsnCryptoReady(): void {
  getKey();
}

export function encryptSsn(plain: string): string {
  if (!plain || plain.startsWith(PREFIX)) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decryptSsn(value: string): string {
  if (!value || !value.startsWith(PREFIX)) return value;
  const [iv, tag, ct] = value.slice(PREFIX.length).split(":");
  const ivBuf = Buffer.from(iv, "base64");
  const tagBuf = Buffer.from(tag, "base64");
  if (ivBuf.length !== 12) throw new Error("Invalid IV length");
  if (tagBuf.length !== 16) throw new Error("Invalid auth tag length");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), ivBuf);
  decipher.setAuthTag(tagBuf);
  return Buffer.concat([decipher.update(Buffer.from(ct, "base64")), decipher.final()]).toString("utf8");
}

export function maskSsn(plain: string): string {
  const digits = plain.replace(/\D/g, "");
  const last4 = digits.length >= 4 ? digits.slice(-4) : "****";
  return `***-**-${last4}`;
}


"use server";

import { webcrypto } from 'crypto';

// This file can run on the server, so we need to ensure crypto is available.
// On the edge, `self.crypto` is available. In Node.js, we need to import it.
const crypto = typeof self !== 'undefined' ? self.crypto : webcrypto;

const enc = new TextEncoder();
const dec = new TextDecoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hexString: string): ArrayBuffer {
  const bytes = new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  return bytes.buffer;
}

async function deriveKey(pass: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pass),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 310000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(msg: string, pass: string): Promise<{ ct: string; salt: string; iv: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pass, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(msg)
  );
  return {
    ct: toHex(ciphertext),
    salt: toHex(salt),
    iv: toHex(iv),
  };
}

export async function decrypt(ct: string, salt: string, iv: string, pass: string): Promise<string> {
  const key = await deriveKey(pass, new Uint8Array(fromHex(salt)));
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromHex(iv) },
    key,
    fromHex(ct)
  );
  return dec.decode(decrypted);
}

const PBKDF2_ITERATIONS = 100_000;
const HASH_LENGTH = 32;
const SALT_LENGTH = 16;

const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function constantTimeEqual(
  a: Uint8Array,
  b: Uint8Array,
): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let difference = 0;

  for (let i = 0; i < a.length; i++) {
    difference |= a[i] ^ b[i];
  }

  return difference === 0;
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<Uint8Array> {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    HASH_LENGTH * 8,
  );

  return new Uint8Array(bits);
}

export async function hashPassword(
  password: string,
): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error("Password must contain at least 8 characters");
  }

  const salt = crypto.getRandomValues(
    new Uint8Array(SALT_LENGTH),
  );

  const derivedKey = await deriveKey(password, salt);

  return [
    "pbkdf2",
    "sha256",
    PBKDF2_ITERATIONS.toString(),
    toBase64(salt),
    toBase64(derivedKey),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  try {
    const parts = storedHash.split("$");

    if (parts.length !== 5) {
      return false;
    }

    const [
      algorithm,
      hashAlgorithm,
      iterationsString,
      saltBase64,
      hashBase64,
    ] = parts;

    if (
      algorithm !== "pbkdf2" ||
      hashAlgorithm !== "sha256"
    ) {
      return false;
    }

    const iterations = Number(iterationsString);

    if (!Number.isInteger(iterations) || iterations <= 0) {
      return false;
    }

    const salt = fromBase64(saltBase64);
    const expectedHash = fromBase64(hashBase64);

    const passwordKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );

    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations,
        hash: "SHA-256",
      },
      passwordKey,
      expectedHash.length * 8,
    );

    const actualHash = new Uint8Array(bits);

    return constantTimeEqual(actualHash, expectedHash);
  } catch {
    return false;
  }
}
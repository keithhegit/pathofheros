export async function hashPassword(password: string, salt: string) {
  const enc = new TextEncoder();
  const data = enc.encode(password + salt);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(digest);
}

export function bufferToHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function randomSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHex: string
) {
  const hex = await hashPassword(password, salt);
  return hex === expectedHex;
}


import crypto from 'node:crypto';

/**
 * Generates a PKCE code_verifier.
 * Returns a URL-safe base64 string of 96 bytes (128 chars).
 * Per RFC 7636: must be 43-128 chars from [A-Z a-z 0-9 - . _ ~]
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(72).toString('base64url');
}

/**
 * Generates a PKCE code_challenge from a verifier.
 * S256 method: BASE64URL(SHA256(code_verifier))
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return hash.toString('base64url');
}

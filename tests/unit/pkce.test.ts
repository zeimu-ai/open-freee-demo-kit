import { describe, it, expect } from 'vitest';
import { generateCodeVerifier, generateCodeChallenge } from '../../src/utils/pkce.js';

describe('PKCE helpers', () => {
  describe('generateCodeVerifier', () => {
    it('returns a string of 43-128 characters', () => {
      const verifier = generateCodeVerifier();
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
    });

    it('contains only URL-safe base64 characters', () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('generates different values each call', () => {
      const v1 = generateCodeVerifier();
      const v2 = generateCodeVerifier();
      expect(v1).not.toBe(v2);
    });
  });

  describe('generateCodeChallenge', () => {
    it('returns a non-empty string', async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      expect(challenge.length).toBeGreaterThan(0);
    });

    it('returns URL-safe base64 without padding', async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      // base64url: A-Z, a-z, 0-9, -, _ (no +, /, =)
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('returns same challenge for same verifier', async () => {
      const verifier = generateCodeVerifier();
      const c1 = await generateCodeChallenge(verifier);
      const c2 = await generateCodeChallenge(verifier);
      expect(c1).toBe(c2);
    });
  });
});

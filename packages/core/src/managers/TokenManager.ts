import { randomBytes } from 'node:crypto';

import { SignJWT, jwtVerify } from 'jose';

export class TokenManager {
  private readonly secret: Uint8Array;

  constructor(secret: string) {
    this.secret = new TextEncoder().encode(secret);
  }

  async generateJwt(
    payload: Record<string, unknown>,
    expiresInMs: number
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + Math.floor(expiresInMs / 1000);

    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(exp)
      .sign(this.secret);
  }

  async verifyJwt<T extends Record<string, unknown>>(
    token: string
  ): Promise<T> {
    const { payload } = await jwtVerify(token, this.secret, {
      algorithms: ['HS256'],
    });
    return payload as T;
  }

  generateRandomToken(): string {
    return randomBytes(32).toString('hex');
  }
}

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const MAX_SCRYPT_MEMORY = 256 * 1024 * 1024;
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

interface ScryptParameters {
  N: number;
  r: number;
  p: number;
  salt: Buffer;
  hash: Buffer;
}

export class PasswordManager {
  constructor(
    private readonly scryptN: number = 32_768,
    private readonly scryptR: number = 8,
    private readonly scryptP: number = 1
  ) {}

  hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    return this.derive(password, salt, KEY_LENGTH, {
      N: this.scryptN,
      r: this.scryptR,
      p: this.scryptP,
    }).then(
      derived =>
        `$scrypt$v1$${this.scryptN}$${this.scryptR}$${this.scryptP}$${salt.toString('hex')}$${derived.toString('hex')}`
    );
  }

  verify(password: string, stored: string): Promise<boolean> {
    const parsed = this.parse(stored);
    if (!parsed) return Promise.resolve(false);
    return this.derive(password, parsed.salt, parsed.hash.length, parsed).then(
      derived =>
        derived.length === parsed.hash.length &&
        timingSafeEqual(parsed.hash, derived)
    );
  }

  needsRehash(stored: string): boolean {
    const parsed = this.parse(stored);
    return (
      !parsed ||
      parsed.N !== this.scryptN ||
      parsed.r !== this.scryptR ||
      parsed.p !== this.scryptP ||
      parsed.hash.length !== KEY_LENGTH ||
      parsed.salt.length !== SALT_LENGTH
    );
  }

  private parse(stored: string): ScryptParameters | null {
    const parts = stored.split('$');
    if (parts.length !== 8 || parts[1] !== 'scrypt' || parts[2] !== 'v1') {
      return null;
    }

    const N = Number(parts[3]);
    const r = Number(parts[4]);
    const p = Number(parts[5]);
    const saltHex = parts[6];
    const hashHex = parts[7];

    if (
      !Number.isSafeInteger(N) ||
      N < 16_384 ||
      N > 65_536 ||
      (N & (N - 1)) !== 0 ||
      !Number.isSafeInteger(r) ||
      r < 1 ||
      r > 16 ||
      !Number.isSafeInteger(p) ||
      p < 1 ||
      p > 4 ||
      128 * N * r + 128 * r * p > MAX_SCRYPT_MEMORY ||
      !saltHex ||
      !/^(?:[a-f0-9]{2}){8,64}$/i.test(saltHex) ||
      !hashHex ||
      !/^(?:[a-f0-9]{2}){32,128}$/i.test(hashHex)
    ) {
      return null;
    }

    return {
      N,
      r,
      p,
      salt: Buffer.from(saltHex, 'hex'),
      hash: Buffer.from(hashHex, 'hex'),
    };
  }

  private derive(
    password: string,
    salt: Buffer,
    keyLength: number,
    parameters: Pick<ScryptParameters, 'N' | 'r' | 'p'>
  ): Promise<Buffer> {
    const maxmem = Math.max(
      64 * 1024 * 1024,
      128 * parameters.N * parameters.r +
        128 * parameters.r * parameters.p +
        64 * 1024 * 1024
    );
    return new Promise((resolve, reject) => {
      scrypt(
        password,
        salt,
        keyLength,
        { ...parameters, maxmem },
        (error, derivedKey) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(derivedKey);
        }
      );
    });
  }
}

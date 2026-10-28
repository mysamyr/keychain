import type {
  ClaimOutboxEmails,
  ConsumeEmailChangeToken,
  ConsumeReauthenticationGrant,
  DeletedRecords,
  DeleteExpiredRecords,
  FailOutboxEmail,
  IDatabaseAdapter,
  NewOutboxEmail,
  OutboxEmail,
  OutboxEmailStatus,
  ReauthenticationGrant,
  Session,
  User,
} from '@mysamyr/core';

import { mapPrismaError } from './errors.js';

type PrismaUser = {
  [K in keyof User]-?:
    Exclude<User[K], undefined> | (undefined extends User[K] ? null : never);
};

type PrismaOutboxEmail = Omit<OutboxEmail, 'status'> & { status: string };

type UserUniqueWhere =
  | { id: string }
  | { email: string }
  | { googleId: string }
  | { verificationTokenHash: string }
  | { passwordResetTokenHash: string };

type UserWhere = {
  id?: string;
  email?: string;
  verificationTokenHash?: string;
  verificationTokenExpiresAt?: { gt: Date };
  pendingEmail?: string;
  pendingEmailTokenHash?: string;
  pendingEmailTokenExpiresAt?: { gt: Date };
  isEmailVerified?: boolean;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: { gt: Date };
};

type UserWriteData = Partial<
  Omit<PrismaUser, 'id' | 'createdAt' | 'updatedAt'>
> & {
  passwordResetTokenHash?: string | null;
  passwordResetExpiresAt?: Date | null;
};

type UserUpdate = Parameters<IDatabaseAdapter['updateUser']>[1];

type OutboxWhere = {
  id?: string;
  status?: string | { in: string[] };
  attempts?: number;
  lockedUntil?: Date | null | { lte: Date };
  nextAttemptAt?: { lte: Date };
  createdAt?: { lt: Date };
  OR?: OutboxWhere[];
};

/** The model operations required from a host-generated Prisma client. */
export interface KeychainPrismaClient {
  reauthenticationGrant: {
    create(args: { data: ReauthenticationGrant }): PromiseLike<unknown>;
    findUnique(args: {
      where: { tokenHash: string };
    }): PromiseLike<ReauthenticationGrant | null>;
    deleteMany(args: {
      where: {
        userId?: string;
        sessionId?: string;
        tokenHash?: string;
        kind?: 'challenge' | 'authorization';
        action?: string;
        expiresAt?: { gt: Date } | { lt: Date };
        codeHash?: string;
      };
    }): PromiseLike<{ count: number }>;
    updateMany(args: {
      where: ConsumeReauthenticationGrant & {
        expiresAt: { gt: Date };
        attempts: { lt: number };
      };
      data: { attempts: { increment: number } };
    }): PromiseLike<{ count: number }>;
  };
  user: {
    findUnique(args: {
      where: UserUniqueWhere;
    }): PromiseLike<PrismaUser | null>;
    findUniqueOrThrow(args: {
      where: UserUniqueWhere;
    }): PromiseLike<PrismaUser>;
    findFirst(args: { where: UserWhere }): PromiseLike<PrismaUser | null>;
    create(args: {
      data: Pick<
        PrismaUser,
        'email' | 'passwordHash' | 'isEmailVerified' | 'googleId'
      >;
    }): PromiseLike<PrismaUser>;
    update(args: {
      where: UserUniqueWhere;
      data: UserWriteData;
    }): PromiseLike<PrismaUser>;
    updateMany(args: {
      where: UserWhere;
      data: UserWriteData;
    }): PromiseLike<{ count: number }>;
    delete(args: { where: { id: string } }): PromiseLike<unknown>;
  };
  session: {
    updateMany(args: {
      where: {
        id: string;
        userId: string;
        expiresAt: { gt: Date };
        OR: Array<
          | { reauthenticationSentAt: null }
          | { reauthenticationSentAt: { lte: Date } }
        >;
      };
      data: { reauthenticationSentAt: Date };
    }): PromiseLike<{ count: number }>;
    create(args: {
      data: Parameters<IDatabaseAdapter['createSession']>[0];
    }): PromiseLike<Session>;
    findUnique(args: {
      where: { id: string } | { tokenHash: string };
    }): PromiseLike<Session | null>;
    findMany(args: {
      where: { userId: string };
      orderBy: { createdAt: 'desc' };
    }): PromiseLike<Session[]>;
    deleteMany(args: {
      where: {
        userId?: string;
        id?: string | { not: string };
        expiresAt?: { lt: Date };
      };
    }): PromiseLike<{ count: number }>;
  };
  emailOutbox: {
    upsert(args: {
      where: { dedupeKey: string };
      create: NewOutboxEmail;
      update: Record<string, never>;
    }): PromiseLike<unknown>;
    findMany(args: {
      where: OutboxWhere;
      orderBy: { nextAttemptAt: 'asc' };
      take: number;
    }): PromiseLike<PrismaOutboxEmail[]>;
    updateMany(args: {
      where: OutboxWhere;
      data: Partial<Omit<OutboxEmail, 'id' | 'dedupeKey' | 'createdAt'>>;
    }): PromiseLike<{ count: number }>;
    update(args: {
      where: { id: string };
      data: Partial<Omit<OutboxEmail, 'id' | 'dedupeKey' | 'createdAt'>>;
    }): PromiseLike<unknown>;
    deleteMany(args: { where: OutboxWhere }): PromiseLike<{ count: number }>;
  };
  $transaction?: <R>(
    fn: (prisma: KeychainPrismaClient) => Promise<R>
  ) => Promise<R>;
}

async function run<T>(operation: () => PromiseLike<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw mapPrismaError(error);
  }
}

export class PrismaAdapter implements IDatabaseAdapter {
  constructor(private readonly prisma: KeychainPrismaClient) {}

  /** Run `fn` atomically, reusing the current transaction when already inside one. */
  private atomic<T>(fn: (prisma: KeychainPrismaClient) => Promise<T>) {
    return run(() =>
      this.prisma.$transaction ? this.prisma.$transaction(fn) : fn(this.prisma)
    );
  }

  async transaction<T>(
    action: (tx: IDatabaseAdapter) => Promise<T>
  ): Promise<T> {
    return this.atomic(tx =>
      action(tx === this.prisma ? this : new PrismaAdapter(tx))
    );
  }

  // --- Email outbox ---

  async enqueueEmail(email: NewOutboxEmail): Promise<void> {
    await run(() =>
      this.prisma.emailOutbox.upsert({
        where: { dedupeKey: email.dedupeKey },
        create: email,
        update: {},
      })
    );
  }

  async claimEmails(input: ClaimOutboxEmails): Promise<OutboxEmail[]> {
    const candidates = await run(() =>
      this.prisma.emailOutbox.findMany({
        where: {
          OR: [
            { status: 'pending', nextAttemptAt: { lte: input.now } },
            { status: 'processing', lockedUntil: { lte: input.now } },
          ],
        },
        orderBy: { nextAttemptAt: 'asc' },
        take: input.limit,
      })
    );

    const claimed: OutboxEmail[] = [];
    for (const candidate of candidates) {
      const result = await run(() =>
        this.prisma.emailOutbox.updateMany({
          where: {
            id: candidate.id,
            status: candidate.status,
            attempts: candidate.attempts,
            lockedUntil: candidate.lockedUntil,
          },
          data: { status: 'processing', lockedUntil: input.lockedUntil },
        })
      );
      if (result.count === 1) {
        claimed.push({
          ...candidate,
          status: 'processing',
          lockedUntil: input.lockedUntil,
        });
      }
    }
    return claimed;
  }

  async markEmailSent(id: string, sentAt: Date): Promise<void> {
    await run(() =>
      this.prisma.emailOutbox.update({
        where: { id },
        data: { status: 'sent', sentAt, payload: null, lockedUntil: null },
      })
    );
  }

  async markEmailFailed(id: string, input: FailOutboxEmail): Promise<void> {
    const status: OutboxEmailStatus = input.nextAttemptAt
      ? 'pending'
      : 'failed';
    await run(() =>
      this.prisma.emailOutbox.update({
        where: { id },
        data: {
          status,
          attempts: input.attempts,
          lastError: input.lastError,
          lockedUntil: null,
          ...(input.nextAttemptAt
            ? { nextAttemptAt: input.nextAttemptAt }
            : { payload: null }),
        },
      })
    );
  }

  async deleteExpiredRecords(
    input: DeleteExpiredRecords
  ): Promise<DeletedRecords> {
    const grants = await run(() =>
      this.prisma.reauthenticationGrant.deleteMany({
        where: { expiresAt: { lt: input.now } },
      })
    );
    const sessions = await run(() =>
      this.prisma.session.deleteMany({
        where: { expiresAt: { lt: input.now } },
      })
    );
    const emails = await run(() =>
      this.prisma.emailOutbox.deleteMany({
        where: {
          status: { in: ['sent', 'failed'] },
          createdAt: { lt: input.outboxBefore },
        },
      })
    );
    return {
      sessions: sessions.count,
      reauthenticationGrants: grants.count,
      outboxEmails: emails.count,
    };
  }

  // --- Reauthentication ---

  async createReauthenticationGrant(
    data: ReauthenticationGrant
  ): Promise<void> {
    await run(() => this.prisma.reauthenticationGrant.create({ data }));
  }

  async createReauthenticationChallenge(
    data: ReauthenticationGrant
  ): Promise<boolean> {
    return this.atomic(async prisma => {
      const now = new Date();
      const claimed = await prisma.session.updateMany({
        where: {
          id: data.sessionId,
          userId: data.userId,
          expiresAt: { gt: now },
          OR: [
            { reauthenticationSentAt: null },
            {
              reauthenticationSentAt: { lte: new Date(now.getTime() - 60_000) },
            },
          ],
        },
        data: { reauthenticationSentAt: now },
      });
      if (claimed.count !== 1) return false;
      await prisma.reauthenticationGrant.deleteMany({
        where: { userId: data.userId, sessionId: data.sessionId },
      });
      await prisma.reauthenticationGrant.create({ data });
      return true;
    });
  }

  async verifyReauthenticationChallenge(
    input: ConsumeReauthenticationGrant & { codeHash: string }
  ): Promise<boolean> {
    return this.atomic(async prisma => {
      const { codeHash, ...binding } = input;
      const attempt = await prisma.reauthenticationGrant.updateMany({
        where: {
          ...binding,
          expiresAt: { gt: new Date() },
          attempts: { lt: 5 },
        },
        data: { attempts: { increment: 1 } },
      });
      if (attempt.count !== 1) return false;
      const result = await prisma.reauthenticationGrant.deleteMany({
        where: { ...binding, expiresAt: { gt: new Date() }, codeHash },
      });
      return result.count === 1;
    });
  }

  async consumeReauthenticationGrant(
    input: ConsumeReauthenticationGrant
  ): Promise<ReauthenticationGrant | null> {
    return this.atomic(async prisma => {
      const grant = await prisma.reauthenticationGrant.findUnique({
        where: { tokenHash: input.tokenHash },
      });
      if (!grant) return null;
      const result = await prisma.reauthenticationGrant.deleteMany({
        where: { ...input, expiresAt: { gt: new Date() } },
      });
      return result.count === 1 ? grant : null;
    });
  }

  async clearReauthenticationGrants(userId: string): Promise<void> {
    await run(() =>
      this.prisma.reauthenticationGrant.deleteMany({ where: { userId } })
    );
  }

  // --- Users and tokens ---

  async getUserByEmail(email: string): Promise<User | null> {
    return this.findUser({ email });
  }

  async getUserByGoogleId(googleId: string): Promise<User | null> {
    return this.findUser({ googleId });
  }

  async getUserById(id: string): Promise<User | null> {
    return this.findUser({ id });
  }

  async consumeEmailVerificationToken(tokenHash: string): Promise<User | null> {
    return this.atomic(async prisma => {
      const user = await prisma.user.findUnique({
        where: { verificationTokenHash: tokenHash },
      });
      if (!user) return null;

      const result = await prisma.user.updateMany({
        where: {
          id: user.id,
          verificationTokenHash: tokenHash,
          verificationTokenExpiresAt: { gt: new Date() },
          isEmailVerified: false,
        },
        data: {
          isEmailVerified: true,
          verificationTokenHash: null,
          verificationTokenExpiresAt: null,
        },
      });
      if (result.count !== 1) return null;
      return this.mapUser(
        await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
      );
    });
  }

  async consumeEmailChangeToken(
    input: ConsumeEmailChangeToken
  ): Promise<User | null> {
    return this.atomic(async prisma => {
      const current = await prisma.user.findUnique({
        where: { id: input.userId },
      });
      if (!current?.passwordHash || current.pendingEmail !== input.newEmail) {
        return null;
      }

      const result = await prisma.user.updateMany({
        where: {
          id: input.userId,
          email: current.email,
          pendingEmail: input.newEmail,
          pendingEmailTokenHash: input.tokenHash,
          pendingEmailTokenExpiresAt: { gt: new Date() },
        },
        data: {
          email: input.newEmail,
          isEmailVerified: true,
          verificationTokenHash: null,
          verificationTokenExpiresAt: null,
          googleId: null,
          pendingEmail: null,
          pendingEmailTokenHash: null,
          pendingEmailTokenExpiresAt: null,
        },
      });
      if (result.count !== 1) return null;

      await prisma.session.deleteMany({ where: { userId: input.userId } });
      return this.mapUser(
        await prisma.user.findUniqueOrThrow({ where: { id: input.userId } })
      );
    });
  }

  async replacePasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<void> {
    await run(() =>
      this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: expiresAt,
        },
      })
    );
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    await run(() =>
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordResetTokenHash: null, passwordResetExpiresAt: null },
      })
    );
  }

  async getUserByPasswordResetTokenHash(
    tokenHash: string
  ): Promise<User | null> {
    const user = await run(() =>
      this.prisma.user.findFirst({
        where: {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: { gt: new Date() },
        },
      })
    );
    return user ? this.mapUser(user) : null;
  }

  async consumePasswordResetToken(
    tokenHash: string,
    passwordHash: string
  ): Promise<boolean> {
    return this.atomic(async prisma => {
      const user = await prisma.user.findUnique({
        where: { passwordResetTokenHash: tokenHash },
      });
      if (!user) return false;

      const result = await prisma.user.updateMany({
        where: {
          id: user.id,
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: { gt: new Date() },
        },
        data: {
          passwordHash,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
          pendingEmail: null,
          pendingEmailTokenHash: null,
          pendingEmailTokenExpiresAt: null,
        },
      });
      if (result.count !== 1) return false;

      await prisma.session.deleteMany({ where: { userId: user.id } });
      return true;
    });
  }

  async createUser(
    data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<User> {
    const user = await run(() =>
      this.prisma.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash ?? null,
          isEmailVerified: data.isEmailVerified,
          googleId: data.googleId ?? null,
        },
      })
    );
    return this.mapUser(user);
  }

  async updateUser(id: string, data: UserUpdate): Promise<User> {
    const user = await run(() =>
      this.prisma.user.update({ where: { id }, data: this.toUserWrite(data) })
    );
    return this.mapUser(user);
  }

  async deleteUser(id: string): Promise<void> {
    await run(() => this.prisma.user.delete({ where: { id } }));
  }

  // --- Sessions ---

  async createSession(
    data: Parameters<IDatabaseAdapter['createSession']>[0]
  ): Promise<Session> {
    const session = await run(() =>
      this.prisma.session.create({
        data: {
          userId: data.userId,
          expiresAt: data.expiresAt,
          userAgent: data.userAgent,
          ip: data.ip,
          tokenHash: data.tokenHash,
        },
      })
    );
    return this.mapSession(session);
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    const sessions = await run(() =>
      this.prisma.session.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
    );
    return sessions.map(s => this.mapSession(s));
  }

  async getSessionById(id: string): Promise<Session | null> {
    const session = await run(() =>
      this.prisma.session.findUnique({ where: { id } })
    );
    return session ? this.mapSession(session) : null;
  }

  async getSessionByTokenHash(tokenHash: string): Promise<Session | null> {
    const session = await run(() =>
      this.prisma.session.findUnique({ where: { tokenHash } })
    );
    return session ? this.mapSession(session) : null;
  }

  async revokeSession(id: string): Promise<void> {
    await run(() => this.prisma.session.deleteMany({ where: { id } }));
  }

  async revokeUserSession(userId: string, sessionId: string): Promise<boolean> {
    const result = await run(() =>
      this.prisma.session.deleteMany({ where: { id: sessionId, userId } })
    );
    return result.count === 1;
  }

  async revokeOtherUserSessions(
    userId: string,
    keepSessionId: string
  ): Promise<void> {
    await run(() =>
      this.prisma.session.deleteMany({
        where: { userId, id: { not: keepSessionId } },
      })
    );
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await run(() => this.prisma.session.deleteMany({ where: { userId } }));
  }

  // --- Mapping ---

  private async findUser(where: UserUniqueWhere): Promise<User | null> {
    const user = await run(() => this.prisma.user.findUnique({ where }));
    return user ? this.mapUser(user) : null;
  }

  private toUserWrite(data: UserUpdate): UserWriteData {
    return {
      ...(data.email !== undefined && { email: data.email }),
      ...(data.passwordHash !== undefined && {
        passwordHash: data.passwordHash,
      }),
      ...(data.isEmailVerified !== undefined && {
        isEmailVerified: data.isEmailVerified,
      }),
      ...('verificationTokenHash' in data && {
        verificationTokenHash: data.verificationTokenHash ?? null,
      }),
      ...('verificationTokenExpiresAt' in data && {
        verificationTokenExpiresAt: data.verificationTokenExpiresAt ?? null,
      }),
      ...('googleId' in data && { googleId: data.googleId ?? null }),
      ...(data.lastVerificationEmailSentAt !== undefined && {
        lastVerificationEmailSentAt: data.lastVerificationEmailSentAt,
      }),
      ...('pendingEmail' in data && {
        pendingEmail: data.pendingEmail ?? null,
      }),
      ...('pendingEmailTokenHash' in data && {
        pendingEmailTokenHash: data.pendingEmailTokenHash ?? null,
      }),
      ...('pendingEmailTokenExpiresAt' in data && {
        pendingEmailTokenExpiresAt: data.pendingEmailTokenExpiresAt ?? null,
      }),
    };
  }

  private mapUser(user: PrismaUser): User {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash ?? undefined,
      isEmailVerified: user.isEmailVerified,
      verificationTokenHash: user.verificationTokenHash ?? undefined,
      verificationTokenExpiresAt: user.verificationTokenExpiresAt ?? undefined,
      googleId: user.googleId ?? undefined,
      lastVerificationEmailSentAt:
        user.lastVerificationEmailSentAt ?? undefined,
      pendingEmail: user.pendingEmail ?? undefined,
      pendingEmailTokenHash: user.pendingEmailTokenHash ?? undefined,
      pendingEmailTokenExpiresAt: user.pendingEmailTokenExpiresAt ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private mapSession(session: Session): Session {
    return {
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
      userAgent: session.userAgent,
      ip: session.ip,
      createdAt: session.createdAt,
    };
  }
}

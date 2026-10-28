# @mysamyr/db-prisma

Prisma database adapter for Keychain.

**Requires:** Node.js 24+ and Prisma `^7.10.1`. Supported databases:
PostgreSQL (reference), MySQL/MariaDB, and SQLite. SQL Server and MongoDB are
not supported.

```sh
npm install @mysamyr/db-prisma @prisma/client
npm install --save-dev prisma
```

Copy the models from [`schema.prisma`](./schema.prisma) (`User`, `Session`,
`ReauthenticationGrant`, `EmailOutbox`) into your schema, keeping their unique
constraints and indexes. Then generate the client and apply the migration:

```sh
npx prisma migrate dev      # development
npx prisma migrate deploy   # production, before starting the API
```

```ts
import { PrismaAdapter } from '@mysamyr/db-prisma';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
const db = new PrismaAdapter(prisma);
```

Pass `db` to `AuthCore`. Clients extended with `$extends` are accepted. Database
errors are mapped to Keychain errors: uniqueness conflicts become `409` and
connection failures `503`. Keychain never applies migrations itself.

import { app } from './app.js';
import { closeAuth } from './auth.js';
import { PORT } from './config/index.js';

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close(() => {
      void closeAuth().finally(() => process.exit(0));
    });
  });
}

import app from './app.js';
import { env } from './config/env.js';
import { closeDatabase, initializeDatabase } from './config/database.js';

await initializeDatabase();

const server = app.listen(env.PORT, () => {
  console.log(`ShelfSight AI API running on port ${env.PORT}`);
  if (env.USE_EMBEDDED_DATABASE) {
    console.log(`Embedded PostgreSQL ready on 127.0.0.1:${env.EMBEDDED_DATABASE_PORT}`);
  }
});

async function shutdown() {
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

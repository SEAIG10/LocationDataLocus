// src/server.ts
import { buildApp } from './app';
import { env } from './config/env';
import { connectDB } from './config/db';

async function start() {
  const app = buildApp();

  try {
    await connectDB();

    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`🚀 LocusBackend is running on http://localhost:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

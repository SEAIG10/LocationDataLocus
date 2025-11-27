// src/server.ts
import { buildApp } from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { connectMQTT, disconnectMQTT } from './modules/mqtt/mqtt.service';

async function start() {
  const app = buildApp();

  try {
    await connectDB();

    // MQTT Broker 연결
    connectMQTT();

    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  disconnectMQTT();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  disconnectMQTT();
  process.exit(0);
});

start();

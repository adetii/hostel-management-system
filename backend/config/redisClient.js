require('dotenv').config();
const { createClient } = require('redis');

let client;
let isConnecting = false;

async function initRedis() {
  if (client && client.isOpen) return client;
  if (isConnecting) return client;

  isConnecting = true;

  client = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT)
    }
  });

  client.on('error', (err) => {
    console.error('Redis Client Error', err);
  });

  await client.connect();
  console.log('Redis connected');
  isConnecting = false;
  return client;
}

function getRedis() {
  if (!client) {
    throw new Error('Redis not initialized. Call initRedis() on server startup.');
  }
  return client;
}

module.exports = { initRedis, getRedis };
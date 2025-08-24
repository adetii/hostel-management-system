const crypto = require('crypto');
const { getRedis } = require('../config/redisClient');

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME;
const IDLE_TTL_SECONDS = Number(process.env.SESSION_TTL_IDLE_SECONDS); // 30m
const ABSOLUTE_TTL_SECONDS = Number(process.env.SESSION_TTL_ABSOLUTE_SECONDS); // 24h
const SESSION_CAP = Number(process.env.SESSION_CAP); //2

function now() {
  return Math.floor(Date.now() / 1000);
}

function sessKey(sessionId) {
  return `sess:${sessionId}`;
}

function userSessionsKey(userId) {
  return `user:sessions:${userId}`;
}

function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Create session with optional tab context
async function createSession({ userId, roles, ip, userAgent, device, tabId }) {
  const redis = getRedis();
  if (!redis) throw new Error('Redis not available');

  const sessionId = generateSessionId();
  const csrfToken = generateCsrfToken();
  const ts = now();

  const session = {
    userId,
    roles,
    createdAt: ts,
    lastSeen: ts,
    ip,
    userAgent,
    csrfToken,
    tabId: tabId || null, // Store tab context
    device: device || null,
  };

  const key = sessKey(sessionId);

  // Store session with both TTL values
  await redis.setEx(key, ABSOLUTE_TTL_SECONDS, JSON.stringify(session));

  // Track user sessions for management (sorted set by timestamp)
  const userKey = userSessionsKey(userId);
  await redis.zAdd(userKey, { score: ts, value: sessionId });

  // Optional: notification can be emitted by controller using Socket.IO
  return { sessionId, session };
}

async function getSession(sessionId) {
  const redis = getRedis();
  if (!redis) return null;
  const data = await redis.get(sessKey(sessionId));
  return data ? JSON.parse(data) : null;
}

// Touch session to extend idle TTL
async function touchSession(sessionId, userId) {
  const redis = getRedis();
  if (!redis) return null;

  const key = sessKey(sessionId);
  const sessionData = await redis.get(key);
  if (!sessionData) return null;

  const session = JSON.parse(sessionData);
  session.lastSeen = now();

  // Reset idle TTL while preserving absolute expiry
  const remainingTtl = await redis.ttl(key);
  const newTtl = Math.min(IDLE_TTL_SECONDS, remainingTtl);
  
  if (newTtl > 0) {
    await redis.setEx(key, newTtl, JSON.stringify(session));
    
    // Update user sessions sorted set
    const userKey = userSessionsKey(userId);
    await redis.zAdd(userKey, { score: session.lastSeen, value: sessionId });
    
    return session;
  }
  
  return null;
}

async function deleteSession(arg) {
  const redis = getRedis();
  if (!redis) return;

  let userId;
  let sessionId;

  if (typeof arg === 'string') {
    // Called with sessionId only
    sessionId = arg;
  } else if (arg && typeof arg === 'object') {
    ({ userId, sessionId } = arg);
  }

  if (!sessionId) {
    return; // nothing to delete
  }

  // If userId not provided, fetch it from the session
  if (!userId) {
    const session = await getSession(sessionId);
    if (session && session.userId) {
      userId = session.userId;
    }
  }

  await redis.del(sessKey(sessionId));

  // Only try to remove from user sessions if we have a valid userId
  if (userId) {
    await redis.zRem(userSessionsKey(userId), sessionId);
  }
}

async function listUserSessions(userId) {
  const redis = getRedis();
  if (!redis) return [];
  
  const keyZ = userSessionsKey(userId);
  const ids = await redis.zRange(keyZ, 0, -1);
  if (!ids || ids.length === 0) return [];

  const results = [];
  for (const id of ids) {
    const s = await getSession(id);
    if (s) {
      results.push({ sessionId: id, ...s });
    } else {
      // Cleanup dangling references
      await redis.zRem(keyZ, id);
    }
  }
  // Sort by lastSeen desc
  results.sort((a, b) => b.lastSeen - a.lastSeen);
  return results;
}

// Get tab-scoped cookie name
function getCookieName(tabId) {
  if (tabId) {
    return `${COOKIE_NAME}_${tabId}`;
  }
  return COOKIE_NAME;
}

module.exports = {
  createSession,
  getSession,
  touchSession,
  deleteSession,
  listUserSessions,
  getCookieName,
  IDLE_TTL_SECONDS,
  ABSOLUTE_TTL_SECONDS
};
// src/middleware/tokenBucket.js
// Manages per-IP token buckets stored in Redis

const redis = require('../../config/redis'); // connects to localhost:6379 by default

const BUCKET_CAPACITY = 10; // max tokens per IP
const REFILL_RATE = 2; // tokens added per second

async function consumeToken(ip) {
  const key = `bucket:${ip}`;

  // Redis returns: [tokens_remaining, last_refill_timestamp]
  const data = await redis.hmget(key, 'tokens', 'lastRefill');

  const now = Date.now();

  let tokens = parseFloat(data[0] ?? BUCKET_CAPACITY);
  let lastRefill = parseInt(data[1] ?? now);

  // Refill based on how much time has passed
  const elapsed = (now - lastRefill) / 1000; // seconds
  tokens = Math.min(BUCKET_CAPACITY, tokens + elapsed * REFILL_RATE);

  if (tokens < 1) {
    return { allowed: false, tokensLeft: 0 };
  }

  // Spend one token and save back to Redis (expires after 60 seconds idle)
  tokens -= 1;

  await redis.hset(key, 'tokens', tokens, 'lastRefill', now);
  await redis.expire(key, 60);

  return { allowed: true, tokensLeft: Math.floor(tokens) };
}

module.exports = { consumeToken };
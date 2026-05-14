const redis = require('../../config/redis');

const Reputation = require("../../models/Reputation");

function normalizeScore(value, fallback = 50) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

// ===============================
// GET REPUTATION (Redis FIRST)
// ===============================
async function getReputation(ip) {
  try {
    const score = await redis.get(`rep:${ip}`);

    if (score !== null) return normalizeScore(score);

    // fallback to MongoDB
    const doc = await Reputation.findOne({ ip });

    if (doc) {
      await redis.set(`rep:${ip}`, doc.score, "EX", 86400);
      return doc.score;
    }

    return 50;
  } catch (err) {
    console.log("getReputation error:", err.message);
    return 50;
  }
}

// ===============================
// PENALISE
// ===============================
async function penalise(ip, amount = 20, reason = "suspicious") {
  try {
    const key = `rep:${ip}`;
    const storedScore = await redis.get(key);
    const current = storedScore === null ? 50 : normalizeScore(storedScore);

    const newScore = Math.min(100, current + amount);

    // Redis update (FAST)
    await redis.set(key, newScore, "EX", 86400);

    // Async Mongo save
    saveToMongo(ip, {
      action: "PENALISE",
      reason,
      delta: amount,
      score: newScore
    });

    return newScore;
  } catch (err) {
    console.log("penalise error:", err.message);
    return 50;
  }
}

// ===============================
// REWARD
// ===============================
async function reward(ip, amount = 5) {
  try {
    const key = `rep:${ip}`;
    const storedScore = await redis.get(key);
    const current = storedScore === null ? 50 : normalizeScore(storedScore);

    const newScore = Math.max(0, current - amount);

    await redis.set(key, newScore, "EX", 86400);

    saveToMongo(ip, {
      action: "REWARD",
      reason: "clean_traffic",
      delta: -amount,
      score: newScore
    });

    return newScore;
  } catch (err) {
    console.log("reward error:", err.message);
    return 50;
  }
}

// ===============================
// MANUAL SET (ADMIN)
// ===============================
async function setReputation(ip, score) {
  try {
    await redis.set(`rep:${ip}`, score, "EX", 86400);

    await Reputation.findOneAndUpdate(
      { ip },
      { score, updatedAt: new Date() },
      { upsert: true }
    );
  } catch (err) {
    console.log("setReputation error:", err.message);
  }
}

// ===============================
// GET HISTORY (MongoDB)
// ===============================
async function getHistory(ip) {
  try {
    const doc = await Reputation.findOne({ ip });
    return doc ? doc.logs : [];
  } catch (err) {
    console.log("getHistory error:", err.message);
    return [];
  }
}

// ===============================
// BACKGROUND SAVE TO MONGODB
// ===============================
async function saveToMongo(ip, logEntry) {
  try {
    await Reputation.findOneAndUpdate(
      { ip },
      {
        $set: {
          score: logEntry.score,
          updatedAt: new Date()
        },
        $push: {
          logs: {
            $each: [{ ...logEntry, time: new Date() }],
            $position: 0,
            $slice: 50
          }
        }
      },
      { upsert: true }
    );
  } catch (err) {
    console.log("Mongo save failed:", err.message);
  }
}

module.exports = {
  getReputation,
  penalise,
  reward,
  setReputation,
  getHistory
};

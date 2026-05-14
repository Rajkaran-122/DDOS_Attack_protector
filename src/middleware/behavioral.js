const redis = require('../../config/redis');

const HISTORY_SIZE = 20;
const STATE_TTL_SECONDS = 120;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

async function analyzeRequest(ip) {
  const historyKey = `behavior:${ip}`;
  const scoreKey = `behavior:score:${ip}`;
  const now = Date.now();

  await redis.lpush(historyKey, now);
  await redis.ltrim(historyKey, 0, HISTORY_SIZE - 1);
  await redis.expire(historyKey, STATE_TTL_SECONDS);

  const timestamps = (await redis.lrange(historyKey, 0, -1))
    .map(Number)
    .reverse();

  if (timestamps.length < 2) {
    await redis.set(scoreKey, 0, "EX", STATE_TTL_SECONDS);
    return {
      score: 0,
      avgGap: 0,
      variance: 0,
      stdDev: 0,
      requestRate: 0,
      sampleCount: timestamps.length
    };
  }

  const gaps = [];
  for (let i = 1; i < timestamps.length; i += 1) {
    const gap = timestamps[i] - timestamps[i - 1];
    if (gap > 0) {
      gaps.push(gap);
    }
  }

  if (gaps.length === 0) {
    await redis.set(scoreKey, 0, "EX", STATE_TTL_SECONDS);
    return {
      score: 0,
      avgGap: 0,
      variance: 0,
      stdDev: 0,
      requestRate: 0,
      sampleCount: timestamps.length
    };
  }

  const recentGaps = gaps.slice(-10);
  const avgGap = recentGaps.reduce((sum, gap) => sum + gap, 0) / recentGaps.length;
  const variance = recentGaps.reduce((sum, gap) => sum + ((gap - avgGap) ** 2), 0) / recentGaps.length;
  const stdDev = Math.sqrt(variance);
  const requestRate = avgGap > 0 ? 1000 / avgGap : 0;

  const speedRisk = clamp((requestRate - 2) / 18, 0, 1) * 55;
  const regularityRisk = (1 - clamp((stdDev - 15) / 385, 0, 1)) * 35;
  const burstRisk = (1 - clamp((avgGap - 40) / 360, 0, 1)) * 10;
  const sampleConfidence = clamp((recentGaps.length - 1) / 8, 0.15, 1);
  const rawScore = clamp((speedRisk + regularityRisk + burstRisk) * sampleConfidence, 0, 100);

  const previousScore = Number.parseFloat(await redis.get(scoreKey));
  const smoothedScore = Number.isNaN(previousScore)
    ? rawScore
    : ((previousScore * 0.7) + (rawScore * 0.3));
  const finalScore = Math.round(clamp(smoothedScore, 0, 100));

  await redis.set(scoreKey, finalScore, "EX", STATE_TTL_SECONDS);

  return {
    score: finalScore,
    avgGap: Number(avgGap.toFixed(1)),
    variance: Number(variance.toFixed(1)),
    stdDev: Number(stdDev.toFixed(1)),
    requestRate: Number(requestRate.toFixed(2)),
    sampleCount: timestamps.length
  };
}

module.exports = { analyzeRequest };

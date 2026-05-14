const MAX_TRACKED_THREATS = 100;
const THREAT_TTL_MS = 15 * 60 * 1000;

const stats = {
  allowed: 0,
  blocked: 0,
  throttled: 0,
  rateLimited: 0
};

const threatSnapshots = new Map();

function updateStats(type) {
  if (type === "BLOCK") stats.blocked++;
  else if (type === "RATE_LIMIT") stats.rateLimited++;
  else if (type === "THROTTLE") stats.throttled++;
  else stats.allowed++;
}

function pruneThreats(now = Date.now()) {
  for (const [ip, threat] of threatSnapshots.entries()) {
    if (now - threat.lastSeen > THREAT_TTL_MS) {
      threatSnapshots.delete(ip);
    }
  }

  if (threatSnapshots.size <= MAX_TRACKED_THREATS) {
    return;
  }

  const survivors = [...threatSnapshots.values()]
    .sort((a, b) => {
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
      if (b.reputationScore !== a.reputationScore) return b.reputationScore - a.reputationScore;
      return b.lastSeen - a.lastSeen;
    })
    .slice(0, MAX_TRACKED_THREATS);

  threatSnapshots.clear();
  survivors.forEach((threat) => {
    threatSnapshots.set(threat.ip, threat);
  });
}

function addThreat(threat) {
  if (!threat?.ip) {
    return;
  }

  const now = Date.now();
  const existing = threatSnapshots.get(threat.ip);
  const finalScore = Number(threat.finalScore ?? threat.score ?? 0);

  threatSnapshots.set(threat.ip, {
    ip: threat.ip,
    behaviorScore: Number(threat.behaviorScore ?? 0),
    mlScore: Number(threat.mlScore ?? 0),
    reputationScore: Number(threat.reputationScore ?? existing?.reputationScore ?? 0),
    tokenBucketEmpty: Boolean(threat.tokenBucketEmpty),
    finalScore,
    score: finalScore,
    decision: threat.decision ?? existing?.decision ?? "ALLOW",
    reasons: Array.isArray(threat.reasons) ? threat.reasons : existing?.reasons ?? [],
    hits: (existing?.hits ?? 0) + 1,
    lastSeen: now
  });

  pruneThreats(now);
}

function getTopThreats(limit = 10) {
  pruneThreats();

  return [...threatSnapshots.values()]
    .sort((a, b) => {
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
      if (b.reputationScore !== a.reputationScore) return b.reputationScore - a.reputationScore;
      return b.lastSeen - a.lastSeen;
    })
    .slice(0, limit);
}

function getStats() {
  return {
    stats: { ...stats },
    topThreats: getTopThreats(),
    totalTracked: threatSnapshots.size
  };
}

module.exports = { updateStats, getStats, addThreat };

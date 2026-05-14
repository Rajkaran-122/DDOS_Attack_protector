// src/middleware/decisionEngine.js
const { consumeToken }                          = require('./tokenBucket');
const { analyzeRequest }                        = require('./behavioral');
const { getReputation, penalise, reward }       = require('./reputation');
const { classify }                              = require('./classifier');
const { updateStats, addThreat }                 = require('../utils/stats');



const flows = new Map();

function getFlowKey(req, ip) {
  return `${ip}-${req.method}-${req.originalUrl}`;
}

function updateFlow(req, ip) {
  const key = getFlowKey(req, ip);
  const now = Date.now();

  if (!flows.has(key)) {
    flows.set(key, {
      firstTime: now,
      lastTime: now,
      totalPackets: 0,
      totalBytes: 0
    });
  }

  const flow = flows.get(key);

  flow.totalPackets += 1;
  flow.totalBytes += parseInt(req.headers['content-length']) || 500;
  flow.lastTime = now;

  return flow;
}
function shieldLayer() {
  return async function (req, res, next) {

    // ── 1. Extract IP ──────────────────────────────────────────────
    const xff = req.headers['x-forwarded-for'];
    const ip  = (xff || req.ip).split(',')[0].trim();
    console.log("IP:", ip);

    // ── 2. Run all checks in parallel ─────────────────────────────
    const [bucket, behavior, reputation] = await Promise.all([
      consumeToken(ip),
      analyzeRequest(ip),
      getReputation(ip),
    ]);

    // ── 3. Feature engineering (correct scale for ML model) ────────
    const flow = updateFlow(req, ip);

    const flowDuration = (flow.lastTime - flow.firstTime) * 1000; // microseconds
    const durationSec = flowDuration / 1e6;

    const packetsPerSec = durationSec > 0
      ? flow.totalPackets / durationSec
      : 0;

    const avgPacketSize = flow.totalPackets > 0
      ? flow.totalBytes / flow.totalPackets
      : 0;

    const bytesPerSec = durationSec > 0
      ? flow.totalBytes / durationSec
      : 0;

    if (flowDuration > 10 * 1e6) { // 10 seconds
      flows.delete(getFlowKey(req, ip));
    }

    const features = {
      flow_duration:   flowDuration,
      request_rate:    packetsPerSec,
      avg_packet_size: avgPacketSize,
      bytes_per_sec:   bytesPerSec
    };
    console.log("FEATURES:", features);

    // ── 4. ML classification ───────────────────────────────────────
    let mlConfidence = 0;
    try {
      const result = await classify(features);
      mlConfidence = result.confidence;
      console.log("ML confidence:", mlConfidence);
    } catch (err) {
      console.log("ML failed, fallback to rules only");
    }

    // ── 5. Multi-factor decision engine ───────────────────────────
    let score   = 0;
    const reasons = [];

    // Factor 1 — ML model (40% weight)
    const mlScore = mlConfidence * 40;
    score += mlScore;
    if (mlConfidence > 0.7) reasons.push(`ml_flagged(${(mlConfidence * 100).toFixed(0)}%)`);

    // Factor 2 — Request rate (30% weight)
    let rateScore = 0;
    if      (packetsPerSec > 100) rateScore = 30;
    else if (packetsPerSec > 50)  rateScore = 20;
    else if (packetsPerSec > 20)  rateScore = 10;
    score += rateScore;
    if (rateScore > 0) reasons.push(`high_rate(${packetsPerSec.toFixed(1)}req/s)`);

    // Factor 3 — Behavior score (20% weight)
    let behaviorScore = 0;
    if      (behavior.score > 80) behaviorScore = 20;
    else if (behavior.score > 60) behaviorScore = 10;
    score += behaviorScore;
    if (behaviorScore > 0) reasons.push(`behavior(${behavior.score})`);

    // Factor 4 — Reputation (10% weight)
    let repScore = 0;
    if      (reputation > 80) repScore = 10;
    else if (reputation > 60) repScore = 5;
    score += repScore;
    if (repScore > 0) reasons.push(`reputation(${reputation})`);

    // Factor 5 — Token bucket empty (hard signal)
    if (!bucket.allowed) {
      score += 20;
      reasons.push("token_bucket_empty");
    }
    console.log({
    mlConfidence,
    packetsPerSec,
    behaviorScore: behavior.score,
    reputation,
    bucketAllowed: bucket.allowed
  });
    console.log(`THREAT SCORE: ${score.toFixed(1)} | REASONS: ${reasons.join(", ") || "none"}`);

    // ── 6. Final decision ──────────────────────────────────────────
    const threat = {
      ip,
      behaviorScore: behavior.score,
      mlScore: mlConfidence * 100, // convert to %
      reputationScore: reputation,
      tokenBucketEmpty: !bucket.allowed,
      finalScore: score
    };
    if (score >= 70) {
      await penalise(ip, 20, reasons.join(", "));
      updateStats("BLOCK");
      addThreat(threat);
      return res.status(403).json({
        error:   "Blocked by ShieldLayer",
        score,
        reasons,
        details: {
          ml_confidence:  mlConfidence,
          behavior_score: behavior.score,
          tokens_left:    bucket.tokensLeft,
          reputation
        }
        
      });
    }

    if (score >= 40) {
      await penalise(ip, 10, reasons.join(", "));
      updateStats("RATE_LIMIT");
      addThreat(threat);
      return res.status(429).json({
        error:   "Too many requests",
        score,
        reasons,
        details: {
          ml_confidence:  mlConfidence,
          behavior_score: behavior.score
        }
      });
    }

    // ── 7. Throttle borderline traffic ────────────────────────────
    if (score >= 20) {
      updateStats("THROTTLE");
      await new Promise(r => setTimeout(r, 200));
      addThreat(threat);
    }

    // ── 8. Clean traffic ───────────────────────────────────────────
    await reward(ip, 2);
    updateStats("ALLOW");
    next();
  };
}

module.exports = { shieldLayer };
// ```

// ---

// ## What Changed

// **`reputation.js`:**
// ```
// ✅ penalise() now accepts a reason string
// ✅ Both penalise() and reward() log history to rep:log:<ip>
// ✅ Keeps last 50 entries per IP
// ✅ Added getHistory() function for dashboard use later
// ```

// **`decisionEngine.js`:**
// ```
// ✅ Removed all the old commented out code
// ✅ Multi-factor scoring (ML + rate + behavior + reputation + bucket)
// ✅ Clean thresholds: 70+ = BLOCK, 40+ = RATE LIMIT
// ✅ penalise() now passes reason strings from all factors
// ✅ Fixed feature scale (microseconds for flow_duration)
// ✅ updateStats called for every decision including ALLOW
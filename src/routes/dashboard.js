// src/routes/dashboard.js — real-time stats API

const router = require('express').Router();
const redis = require('../../config/redis');
const { getStats } = require('../utils/stats'); 
const { setReputation } = require('../middleware/reputation');

// GET /api/shield/stats — top attacked IPs and overall metrics
router.get('/stats', async (req, res) => {
  //const keys = await redis.keys('rep:*');

  //const scores = await Promise.all(keys.map((k) => redis.get(k)));

  /*const topThreats = keys
    .map((k, i) => {
      const score = +scores[i];
      return {
        ip: k.replace('rep:', ''),
        score,
        finalScore: score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);*/
  const { stats: aggregate, topThreats } = getStats();

  res.json({
    topThreats,
    stats: aggregate,
  });
});

// POST /api/shield/block — manually block an IP
router.post('/block', async (req, res) => {
  const { ip } = req.body;

  await setReputation(ip, 100); // max threat score = permanent block

  res.json({
    success: true,
    message: `${ip} blocked`,
  });
});

// POST /api/shield/whitelist — manually whitelist an IP
router.post('/whitelist', async (req, res) => {
  const { ip } = req.body;

  await setReputation(ip, 0); // trust score = always let through

  res.json({
    success: true,
    message: `${ip} whitelisted`,
  });
});

module.exports = router;
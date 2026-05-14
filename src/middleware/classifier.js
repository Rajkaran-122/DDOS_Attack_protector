const axios = require("axios");

const ML_TIMEOUT_MS = 300;
const DEBUG_SHIELD = process.env.SHIELD_DEBUG === '1';

async function classify(features) {
  try {
    const res = await axios.post("http://127.0.0.1:8000/predict", features, {
      timeout: ML_TIMEOUT_MS
    });
    return res.data;
  } catch (err) {
    if (DEBUG_SHIELD) {
      console.log("ML failed:", err.code);
    }
    return { confidence: 0 }; // fallback
  }
}

module.exports = { classify };

const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  time:   { type: Date, default: Date.now },
  action: { 
    type: String, 
    enum: ["ALLOW", "BLOCK", "THROTTLE", "RATE_LIMIT", "PENALISE", "REWARD", "MANUAL_BLOCK", "WHITELIST"],
    required: true
  },
  reason: { type: String, required: true },
  delta:  { type: Number, required: true },
  score:  { type: Number, required: true }
});

const reputationSchema = new mongoose.Schema({
  ip: { type: String, unique: true },

  score: {
    type: Number,
    default: 10,
    min: 0,
    max: 100
  },

  logs: [logSchema],

  updatedAt: {
  type: Date,
  default: Date.now
}
});

module.exports = mongoose.model("Reputation", reputationSchema);

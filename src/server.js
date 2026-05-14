// src/server.js — the entry point for the whole system

const express = require('express');
const { shieldLayer } = require('./middleware/decisionEngine');
const dashboardRoutes = require('./routes/dashboard');
const { getStats } = require('./utils/stats');

const connectDB = require('../config/db');

const app = express();
app.set('trust proxy', true);
app.use(express.json());

connectDB();
const cors = require('cors');
app.use(cors());

// This single line is the entire bouncer — it runs BEFORE every route
app.use(shieldLayer());

// Admin dashboard routes (shows live stats)
app.use('/api/shield', dashboardRoutes);

// Your real application routes go here
app.get('/', (req, res) => {
  res.send('Hello — you passed the shield!');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
app.get("/api/stats", (req, res) => {
  res.json(getStats());
});

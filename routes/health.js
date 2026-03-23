const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/", (_req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    ok: true,
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      connected: isDbConnected,
      name: mongoose.connection.name || null,
      host: mongoose.connection.host || null,
    },
  });
});

module.exports = router;

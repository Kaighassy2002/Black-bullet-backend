const express = require("express");
const cors = require("cors");

const healthRouter = require("./routes/health");

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "black_bullet_backend",
    message: "Server initialized",
  });
});

app.use("/api/health", healthRouter);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

module.exports = app;

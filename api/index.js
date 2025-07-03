const express = require("express");
const app = express();
const serverless = require("serverless-http");
require("dotenv").config();
const cors = require("cors");
const path = require("path");

// Routes
const authRoutes = require("../routes/authRoutes");
const notificationRoutes = require("../routes/notificationRoutes");
const reservationRoutes = require("../routes/reservationRoutes");
const tripRoutes = require("../routes/tripRoutes");
const userRoutes = require("../routes/userRoutes");
const adminRoutes = require("../routes/adminRoutes");

app.use(cors());
app.use(express.json());

// Sert les fichiers statiques comme /docs et /swagger.json
app.use(express.static(path.resolve(__dirname, "../public")));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
    res.send(`
    <h1>Bienvenue sur l'API PartaRoute</h1>
    <p><a href="/docs">Voir la documentation Swagger</a></p>
  `);
});

app.use((req, res, next) => {
    res.status(404).json({ success: false, message: "Route introuvable." });
});

app.use((err, req, res, next) => {
    console.error("Erreur serveur :", err);
    res.status(500).json({ success: false, message: "Erreur interne du serveur." });
});

// Export as serverless function
module.exports = app;
module.exports.handler = serverless(app);

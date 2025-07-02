const express = require("express");
const app = express();
const serverless = require("serverless-http");
require("dotenv").config();
const cors = require("cors");

// Routes
const authRoutes = require("../routes/authRoutes");
const notificationRoutes = require("../routes/notificationRoutes");
const reservationRoutes = require("../routes/reservationRoutes");
const tripRoutes = require("../routes/tripRoutes");
const userRoutes = require("../routes/userRoutes");
const adminRoutes = require("../routes/adminRoutes");

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
    res.send("Bienvenue sur l'API !");
});

const setupSwagger = require("../docs/swagger.js");
setupSwagger(app);

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

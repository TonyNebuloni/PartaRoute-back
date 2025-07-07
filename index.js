require("dotenv").config();
const express = require("express");
const path = require('path');
const prisma = require('./prisma/prisma');
const authMiddleware = require('./middlewares/auth');
const app = express();
const port = 3000;
const cors = require("cors");

// Importation des routes
const authRoutes = require("./routes/authRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const tripRoutes = require("./routes/tripRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use(cors());
app.use(express.json());

// Sert les fichiers statiques (Swagger UI, images, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Utilisation des routes
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

// Middleware 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route introuvable.",
  });
});

// Middleware global pour erreurs 500
app.use((err, req, res, next) => {
  console.error("Erreur serveur :", err);
  res.status(500).json({
    success: false,
    message: "Erreur interne du serveur.",
  });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`✅ Serveur actif sur http://localhost:${port}`);
  console.log(`📘 Swagger disponible sur http://localhost:${port}/docs`);
});

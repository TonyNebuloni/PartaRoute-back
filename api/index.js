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

const allowedOrigins = [
  "https://parta-route-front.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173"
];

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

app.use('/swagger-ui', express.static(path.join(__dirname, '../public/swagger-ui')));

// Sert les fichiers statiques comme /docs et /swagger.json
app.get("/swagger.json", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/swagger.json'));
});

app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin ||
      allowedOrigins.indexOf(origin) !== -1 ||
      /^https:\/\/partaroute-back-tlge-[^.]+-barraults-projects\.vercel\.app$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
    res.send(`
    <h1>Bienvenue sur l'API PartaRoute</h1>
    <p><a href="/docs/index.html">Voir la documentation Swagger</a></p>
    `);
});

app.use((err, req, res, next) => {
    console.error("Erreur serveur :", err);
    res.status(500).json({ success: false, message: "Erreur interne du serveur." });
});

// Export as serverless function
module.exports = app;
module.exports.handler = serverless(app);

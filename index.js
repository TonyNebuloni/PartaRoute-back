require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');

// Importation des routes
const authRoutes = require('./routes/authRoutes');

const notificationRoutes = require('./routes/notificationRoutes');

const reservationRoutes = require('./routes/reservationRoutes');

const tripRoutes = require('./routes/tripRoutes');


app.use(cors());
app.use(express.json());

// Utilisation des routes
app.use('/api/auth', authRoutes);

app.use('/api/reservations', reservationRoutes);

app.use('/api/trips', tripRoutes);

app.use('/api/notifications', notificationRoutes);



app.get('/', (req, res) => {
  res.send("Bienvenue sur l'API !");
});


const setupSwagger = require("./docs/swagger.js");
setupSwagger(app);

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route introuvable.",
  });
});

// Gestion globale des erreurs (500)
app.use((err, req, res, next) => {
  console.error("Erreur serveur :", err);
  res.status(500).json({
    success: false,
    message: "Erreur interne du serveur.",
  });
});
app.listen(port, () => {
  console.log(`✅ Serveur sécurisé actif sur http://localhost:${port}`);
});

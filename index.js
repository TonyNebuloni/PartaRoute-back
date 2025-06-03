require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');

// Importation des routes
const authRoutes = require('./routes/authRoutes');


const reservationRoutes = require('./routes/reservationRoutes');

const tripRoutes = require('./routes/tripRoutes');


app.use(cors());
app.use(express.json());

// Utilisation des routes
app.use('/api/auth', authRoutes);


app.use('/api/reservations', reservationRoutes);

app.use('/api/trips', tripRoutes); 


app.get('/', (req, res) => {
  res.send("Bienvenue sur l'API !");
});

app.listen(port, () => {
  console.log(`✅ Serveur sécurisé actif sur http://localhost:${port}`);
});

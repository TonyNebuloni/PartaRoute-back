require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');

// Importation des routes
const authRoutes = require('./routes/authRoutes');
const trajetRoutes = require('./routes/trajetRoutes');

app.use(cors());
app.use(express.json());

// Utilisation des routes
app.use('/api/auth', authRoutes);
app.use('/api/trajets', trajetRoutes); 

app.get('/', (req, res) => {
  res.send("Bienvenue sur l'API !");
});

app.listen(port, () => {
  console.log(`✅ Serveur sécurisé actif sur http://localhost:${port}`);
});

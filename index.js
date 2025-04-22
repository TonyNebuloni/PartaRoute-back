require('dotenv').config();
const express = require('express')
const app = express()
const port = 3000
const cors = require('cors');

//importation routes
const authRoutes = require('./routes/authRoutes');
const utilisateurRoutes = require('./routes/utilisateurRoutes');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/utilisateurs', utilisateurRoutes);




app.get('/', (req, res) => {
  res.send('Bienvenue sur l\'API !');
})

app.listen(port, () => {
    console.log(`✅ Serveur sécurisé actif sur http://localhost:${port}`);
})
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.register = async (req, res) => {
  const { nom, email, mot_de_passe, role } = req.body;

  try {
    const existingUser = await prisma.utilisateur.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'Utilisateur déjà existant' });

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    const user = await prisma.utilisateur.create({
      data: {
        nom,
        email,
        mot_de_passe: hashedPassword,
        role,
        photo_profil: '',
      },
    });

    res.status(201).json({ message: 'Utilisateur créé', userId: user.id_utilisateur });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, mot_de_passe } = req.body;

  try {
    const user = await prisma.utilisateur.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé' });

    const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!isMatch) return res.status(400).json({ message: 'Mot de passe incorrect' });

    const token = jwt.sign(
      { userId: user.id_utilisateur, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

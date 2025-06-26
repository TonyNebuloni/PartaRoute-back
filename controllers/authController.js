const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/prisma');



exports.register = async (req, res) => {
  const { nom, email, mot_de_passe } = req.body;

  // Vérification des champs requis
  if (!nom || !email || !mot_de_passe) {
    return res.status(400).json({
      success: false,
      message: "Tous les champs (nom, email, mot_de_passe) sont obligatoires.",
    });
  }

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.utilisateur.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Un utilisateur avec cet email existe déjà.",
      });
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    const user = await prisma.utilisateur.create({
      data: {
        nom,
        email,
        mot_de_passe: hashedPassword,
        role: "user", 
        photo_profil: '',
      },
    });

    return res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès.",
      data: {
        id_utilisateur: user.id_utilisateur,
        email: user.email,
        nom: user.nom,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne est survenue lors de l'inscription.",
    });
  }
};
// LOGIN
exports.login = async (req, res) => {
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe) {
    return res.status(400).json({
      success: false,
      message: "Email et mot de passe sont obligatoires.",
    });
  }

  try {
    const user = await prisma.utilisateur.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects.",
      });
    }

    const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects.",
      });
    }

    const payload = {
      id_utilisateur: user.id_utilisateur,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      success: true,
      message: "Connexion réussie.",
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error("Erreur lors de la connexion :", err);
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la connexion.",
    });
  }
};

// REFRESH TOKEN
exports.refreshToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token manquant.",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const payload = {
      id_utilisateur: decoded.id_utilisateur,
      role: decoded.role,
    };

    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });

    return res.status(200).json({
      success: true,
      message: "Nouveau token généré.",
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (err) {
    console.error("Erreur de refresh token :", err);
    return res.status(403).json({
      success: false,
      message: "Refresh token invalide ou expiré.",
    });
  }
};
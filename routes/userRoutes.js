const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const authorizeSelfOrAdmin = require('../middlewares/authorizeSelfOrAdmin');
const adminOnly = require('../middlewares/adminOnly');
const prisma = require('../prisma/prisma');

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Gestion des utilisateurs
 */

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Récupérer les informations d'un utilisateur
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Informations utilisateur récupérées
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/:id', authMiddleware, authorizeSelfOrAdmin, userController.getUserById);

/**
 * @swagger
 * /user/edit:
 *   put:
 *     summary: Modifier les informations de l'utilisateur connecté
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               email:
 *                 type: string
 *               mot_de_passe:
 *                 type: string
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour
 *       500:
 *         description: Erreur serveur
 */
router.put('/edit', authMiddleware, userController.editUser);

/**
 * @swagger
 * /user/delete:
 *   delete:
 *     summary: Supprimer son compte utilisateur
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Utilisateur supprimé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/delete', authMiddleware, userController.deleteUser);

/**
 * @swagger
 * /user/{id}/promote:
 *   patch:
 *     summary: Promouvoir un utilisateur en administrateur
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur à promouvoir
 *     responses:
 *       200:
 *         description: Utilisateur promu admin
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Utilisateur non trouvé
 */
router.patch('/:id/promote', authMiddleware, adminOnly, userController.promoteToAdmin);

// Configuration de multer pour l'upload de photo de profil
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = '/tmp/profile_photos/';
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `user_${req.user.id_utilisateur}_${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Route d'upload de photo de profil utilisateur
router.post('/upload-photo', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier envoyé.' });
    }
    const fileUrl = `/tmp/profile_photos/${req.file.filename}`;
    await prisma.utilisateur.update({
      where: { id_utilisateur: req.user.id_utilisateur },
      data: { photo_profil: fileUrl }
    });
    res.json({ success: true, photo_profil: fileUrl });
  } catch (err) {
    console.error('Erreur upload photo:', err);
    res.status(500).json({ success: false, message: "Erreur lors de l'upload." });
  }
});

module.exports = router;

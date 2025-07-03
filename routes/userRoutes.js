const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const authorizeSelfOrAdmin = require('../middlewares/authorizeSelfOrAdmin');
const adminOnly = require('../middlewares/adminOnly');

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

module.exports = router;

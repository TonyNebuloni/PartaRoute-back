const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const adminOnly = require('../middlewares/adminOnly');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Routes réservées aux administrateurs
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Récupérer tous les utilisateurs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs récupérée avec succès
 *       403:
 *         description: Accès refusé
 */
router.get('/users', authMiddleware, adminOnly, userController.getAllUsers);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Récupérer un utilisateur spécifique
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/users/:id', authMiddleware, adminOnly, userController.getUserById);

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     summary: Modifier un utilisateur
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour
 *       403:
 *         description: Accès refusé
 *       409:
 *         description: Email déjà utilisé
 *       500:
 *         description: Erreur serveur
 */
router.put('/users/:id', authMiddleware, adminOnly, userController.editUserByAdmin);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Utilisateur supprimé
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/users/:id', authMiddleware, adminOnly, userController.deleteUserByAdmin);

/**
 * @swagger
 * /admin/user/{id}/promote:
 *   patch:
 *     summary: Promouvoir un utilisateur en administrateur
 *     tags: [Admin]
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
router.patch('/user/:id/promote', authMiddleware, adminOnly, userController.promoteToAdmin);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Statistiques globales du dashboard admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques globales
 */
router.get('/stats', authMiddleware, adminOnly, userController.getAdminStats);

/**
 * @swagger
 * /admin/trips:
 *   get:
 *     summary: Liste de tous les trajets
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des trajets
 */
router.get('/trips', authMiddleware, adminOnly, userController.getAllTrips);

/**
 * @swagger
 * /admin/trips/{id}:
 *   delete:
 *     summary: Supprimer un trajet par son ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du trajet à supprimer
 *     responses:
 *       200:
 *         description: Trajet supprimé
 */
router.delete('/trips/:id', authMiddleware, adminOnly, userController.deleteTrip);

/**
 * @swagger
 * /admin/reservations:
 *   get:
 *     summary: Liste de toutes les réservations
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des réservations
 */
router.get('/reservations', authMiddleware, adminOnly, userController.getAllReservations);

/**
 * @swagger
 * /admin/reservations/{id}:
 *   delete:
 *     summary: Supprimer une réservation par son ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la réservation à supprimer
 *     responses:
 *       200:
 *         description: Réservation supprimée
 */
router.delete('/reservations/:id', authMiddleware, adminOnly, userController.deleteReservation);

module.exports = router;
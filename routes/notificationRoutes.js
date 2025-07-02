const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authenticateToken = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestion des notifications
 */

/**
 * @swagger
 * /notifications/utilisateur/{utilisateurId}:
 *   get:
 *     summary: Récupérer toutes les notifications d'un utilisateur
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: utilisateurId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page pour la pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Liste paginée des notifications récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Non autorisé
 *     examples:
 *       application/json:
 *         value:
 *           success: true
 *           page: 1
 *           limit: 10
 *           total: 15
 *           data: [ { id_notification: 1, ... }, ... ]
 */
router.get('/utilisateur/:utilisateurId', authenticateToken, notificationController.getAllNotifications);

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Créer une notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - utilisateur_id
 *               - type
 *               - contenu_message
 *             properties:
 *               utilisateur_id:
 *                 type: integer
 *               reservation_id:
 *                 type: integer
 *                 nullable: true
 *               type:
 *                 type: string
 *                 enum: [demande_reservation, confirmation, refus, annulation, generique]
 *               contenu_message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification créée avec succès
 *       400:
 *         description: Données manquantes ou invalides
 *       401:
 *         description: Non autorisé
 */
router.post('/', authenticateToken, notificationController.createNotification);

/**
 * @swagger
 * /notifications/{notificationId}/lue:
 *   patch:
 *     summary: Marquer une notification comme lue
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la notification
 *     responses:
 *       200:
 *         description: Notification marquée comme lue
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Notification non trouvée
 */
router.patch('/:notificationId/lue', authenticateToken, notificationController.markAsRead);

/**
 * @swagger
 * /notifications/{notificationId}:
 *   delete:
 *     summary: Supprimer une notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la notification
 *     responses:
 *       200:
 *         description: Notification supprimée
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Notification non trouvée
 */
router.delete('/:notificationId', authenticateToken, notificationController.deleteNotification);

module.exports = router;

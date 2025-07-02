const express = require("express");
const router = express.Router();
const { 
  createReservation,
  getReservations,
  changeStatutReservation,
  cancelReservation,
  getReservationsForDriver
} = require("../controllers/reservationController");
const authenticateToken = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Gestion des réservations
 */

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Créer une réservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trajet_id
 *             properties:
 *               trajet_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Réservation créée avec succès
 *       400:
 *         description: Données manquantes ou invalides
 *       401:
 *         description: Non autorisé
 */
router.post("/", authenticateToken, createReservation);

/**
 * @swagger
 * /reservations:
 *   get:
 *     summary: Récupérer les réservations de l'utilisateur
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Liste paginée des réservations récupérée avec succès
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
 *           total: 20
 *           data: [ { id_reservation: 1, ... }, ... ]
 */
router.get("/", authenticateToken, getReservations);

/**
 * @swagger
 * /reservations/{id}/statut:
 *   post:
 *     summary: Changer le statut d'une réservation (accepter/refuser)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la réservation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - statut
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [acceptee, refusee]
 *     responses:
 *       200:
 *         description: Statut de la réservation mis à jour
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Réservation non trouvée
 */
router.post("/:id/statut", authenticateToken, changeStatutReservation);

/**
 * @swagger
 * /reservations/{id}/annuler:
 *   patch:
 *     summary: Annuler une réservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la réservation à annuler
 *     responses:
 *       200:
 *         description: Réservation annulée avec succès
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Réservation non trouvée
 */
router.patch('/:id/annuler', authenticateToken, cancelReservation);

/**
 * @swagger
 * /conducteur/reservations:
 *   get:
 *     summary: Récupérer toutes les réservations pour les trajets dont l'utilisateur connecté est le conducteur
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Liste paginée des réservations pour les trajets du conducteur
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
 *           total: 8
 *           data: [ { id_reservation: 1, ... }, ... ]
 */
router.get("/conducteur/reservations", authenticateToken, getReservationsForDriver);

router.get('/:id', authenticateToken, require('../controllers/reservationController').getReservationById);

module.exports = router;

const express = require("express");
const router = express.Router();
const { 
  createReservation,
  getReservations,
  changeStatutReservation,
  cancelReservation 
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
 *     responses:
 *       200:
 *         description: Liste des réservations récupérée avec succès
 *       401:
 *         description: Non autorisé
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

module.exports = router;

const express = require("express");
const router = express.Router();
const { createTrip, getTrips, updateTrip, deleteTrip } = require("../controllers/tripController");
const authenticateToken = require("../middlewares/auth");

/**
 * @swagger
 * /trips:
 *   post:
 *     summary: Créer un nouveau trajet
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Trajets
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ville_depart
 *               - ville_arrivee
 *               - date_heure_depart
 *               - places_disponibles
 *               - prix
 *             properties:
 *               ville_depart:
 *                 type: string
 *               ville_arrivee:
 *                 type: string
 *               date_heure_depart:
 *                 type: string
 *                 format: date-time
 *               places_disponibles:
 *                 type: integer
 *               prix:
 *                 type: number
 *               conditions:
 *                 type: object
 *     responses:
 *       201:
 *         description: Trajet créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Token manquant ou invalide
 */
router.post("/", authenticateToken, createTrip);

/**
 * @swagger
 * /trips:
 *   get:
 *     summary: Récupérer la liste des trajets
 *     tags:
 *       - Trajets
 *     parameters:
 *       - in: query
 *         name: ville_depart
 *         schema:
 *           type: string
 *         description: Ville de départ
 *       - in: query
 *         name: ville_arrivee
 *         schema:
 *           type: string
 *         description: Ville d'arrivée
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de départ (YYYY-MM-DD)
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
 *         description: Liste paginée des trajets
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
 *           total: 42
 *           data: [ { id_trajet: 1, ... }, ... ]
 */
router.get("/", getTrips);

/**
 * @swagger
 * /trips/{id}:
 *   patch:
 *     summary: Mettre à jour un trajet existant
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Trajets
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du trajet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ville_depart:
 *                 type: string
 *               ville_arrivee:
 *                 type: string
 *               date_heure_depart:
 *                 type: string
 *                 format: date-time
 *               places_disponibles:
 *                 type: integer
 *               prix:
 *                 type: number
 *               conditions:
 *                 type: object
 *     responses:
 *       200:
 *         description: Trajet mis à jour
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Trajet non trouvé
 */
router.patch("/:id", authenticateToken, updateTrip);

/**
 * @swagger
 * /trips/{id}:
 *   delete:
 *     summary: Supprimer un trajet
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Trajets
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du trajet
 *     responses:
 *       200:
 *         description: Trajet supprimé
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Trajet non trouvé
 */
router.delete("/:id", authenticateToken, deleteTrip);

/**
 * @swagger
 * /trips/conducteur/trajets:
 *   get:
 *     summary: Récupérer tous les trajets proposés par le conducteur connecté
 *     tags: [Trips]
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
 *         description: Liste paginée des trajets du conducteur
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
 *           total: 5
 *           data: [ { id_trajet: 1, ... }, ... ]
 */
router.get("/conducteur/trajets", authenticateToken, require("../controllers/tripController").getTripsForDriver);

/**
 * @swagger
 * /trips/{id}:
 *   get:
 *     summary: Récupérer un trajet précis par son ID
 *     tags: [Trajets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du trajet
 *     responses:
 *       200:
 *         description: Trajet trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Trajet non trouvé
 */
router.get('/:id', require('../controllers/tripController').getTripById);

module.exports = router;

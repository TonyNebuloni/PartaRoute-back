const express = require("express");
const router = express.Router();
const { createReservation } = require("../controllers/reservationController");
const { getReservations } = require("../controllers/reservationController");
const { changeStatutReservation } = require("../controllers/reservationController");
const { cancelReservation } = require("../controllers/reservationController");
const authenticateToken = require("../middlewares/auth");

// Route pour créer une nouvelle réservation
router.post("/", authenticateToken, createReservation);
// Route pour récupérer les réservations d'un utilisateur
router.get("/", authenticateToken, getReservations);
// Route pour valider une réservation
router.post("/:id/statut", authenticateToken, changeStatutReservation);
// Route pour annuler une réservation
router.patch('/:id/annuler', authenticateToken, cancelReservation);



module.exports = router;

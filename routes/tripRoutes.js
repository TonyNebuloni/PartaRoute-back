const express = require("express");
const router = express.Router();
const { createTrip, getTrips, updateTrip, deleteTrip } = require("../controllers/tripController");
const authenticateToken = require("../middlewares/auth");

router.post("/", authenticateToken, createTrip);
router.get("/", getTrips);
router.patch("/:id", authenticateToken, updateTrip);
router.delete("/:id", authenticateToken, deleteTrip);


module.exports = router;

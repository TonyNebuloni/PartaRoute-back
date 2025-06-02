const express = require("express");
const router = express.Router();
const { creerTrajet } = require("../controllers/trajetController");
const authenticateToken  = require("../middlewares/auth");
const { getTrajets } = require("../controllers/trajetController");

router.post("/", authenticateToken, creerTrajet);
router.get("/", getTrajets);
module.exports = router;



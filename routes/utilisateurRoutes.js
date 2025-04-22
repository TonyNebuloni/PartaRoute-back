const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateurController');
const auth = require('../middlewares/auth');

router.put('/:id', auth, utilisateurController.updateUtilisateur);
router.delete('/:id', auth, utilisateurController.deleteUtilisateur);

module.exports = router;

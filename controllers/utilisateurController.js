const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.updateUtilisateur = async (req, res) => {
    const id = parseInt(req.params.id);
  
    if (req.user.userId !== id) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier cet utilisateur." });
    }
  
    const { nom, email, photo_profil, preferences } = req.body;
  
    try {
      const utilisateur = await prisma.utilisateur.update({
        where: { id_utilisateur: id },
        data: { nom, email, photo_profil, preferences },
      });
  
      res.json({ message: 'Utilisateur mis à jour', utilisateur });
    } catch (err) {
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  };

exports.deleteUtilisateur = async (req, res) => {
    const id = parseInt(req.params.id);

    if (req.user.userId !== id) {
        return res.status(403).json({ message: "Vous n'êtes pas autorisé à supprimer cet utilisateur." });
    }

    try {
        await prisma.utilisateur.delete({
        where: { id_utilisateur: id },
        });

        res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};
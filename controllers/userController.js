const prisma = require('../prisma/prisma');
const notificationService = require('../services/notificationService');

const bcrypt = require("bcryptjs");

const DEFAULT_PHOTO = '/uploads/profile_photos/default.png';

// ────────────────────────────────
// UTILISATEUR CONNECTÉ
// ────────────────────────────────

exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.utilisateur.findUnique({
      where: { id_utilisateur: parseInt(id) },
      select: {
        id_utilisateur: true,
        nom: true,
        email: true,
        role: true,
        photo_profil: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé." });
    }

    const photoUrl = user.photo_profil || DEFAULT_PHOTO;

    res.status(200).json({
      success: true,
      data: {
        ...user,
        photo_profil: photoUrl,
        links: generateUserLinks(user)
      }
    });
  } catch (err) {
    console.error("Erreur getUserById:", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

exports.editUser = async (req, res) => {
  const { nom, email, mot_de_passe } = req.body;
  const { id_utilisateur } = req.user;

  try {
    const emailExists = await prisma.utilisateur.findFirst({
      where: {
        email,
        NOT: { id_utilisateur },
      },
    });
    if (emailExists) {
      return res.status(409).json({ success: false, message: "Cet email est déjà utilisé." });
    }

    const updateData = { nom, email };

    if (mot_de_passe) {
      const hashed = await bcrypt.hash(mot_de_passe, 10);
      updateData.mot_de_passe = hashed;
    }

    const updatedUser = await prisma.utilisateur.update({
      where: { id_utilisateur },
      data: updateData,
      select: { id_utilisateur: true, nom: true, email: true, role: true, photo_profil: true },
    });

    const photoUrl = updatedUser.photo_profil || DEFAULT_PHOTO;

    res.status(200).json({
      success: true,
      data: {
        ...updatedUser,
        photo_profil: photoUrl,
        links: generateUserLinks(updatedUser)
      }
    });
  } catch (err) {
    console.error("Erreur editUser:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la mise à jour." });
  }
};

exports.deleteUser = async (req, res) => {
  const { id_utilisateur } = req.user;

  try {
    // 1. Supprimer les trajets où l'utilisateur est conducteur
    const trajets = await prisma.trajet.findMany({ where: { conducteur_id: id_utilisateur } });
    for (const trajet of trajets) {
      // Trouver les réservations/passagers de ce trajet
      const reservations = await prisma.reservation.findMany({ where: { trajet_id: trajet.id_trajet } });
      for (const reservation of reservations) {
        // Notifier chaque passager de l'annulation du trajet
        await notificationService.createNotification({
          utilisateur_id: reservation.passager_id,
          reservation_id: reservation.id_reservation,
          type: 'annulation',
          contenu_message: "Le trajet auquel vous étiez inscrit a été annulé car le conducteur a supprimé son compte."
        });
      }
      // Supprimer les réservations du trajet
      await prisma.reservation.deleteMany({ where: { trajet_id: trajet.id_trajet } });
      // Supprimer le trajet
      await prisma.trajet.delete({ where: { id_trajet: trajet.id_trajet } });
    }

    // 2. Supprimer les réservations où l'utilisateur est passager
    const reservationsAsPassenger = await prisma.reservation.findMany({ where: { passager_id: id_utilisateur }, include: { trajet: true } });
    for (const reservation of reservationsAsPassenger) {
      // Notifier le conducteur du trajet
      if (reservation.trajet) {
        await notificationService.createNotification({
          utilisateur_id: reservation.trajet.conducteur_id,
          reservation_id: reservation.id_reservation,
          type: 'annulation',
          contenu_message: "Un passager a annulé sa réservation car il a supprimé son compte."
        });
      }
      // Supprimer la réservation
      await prisma.reservation.delete({ where: { id_reservation: reservation.id_reservation } });
    }

    // 3. Supprimer les notifications liées à l'utilisateur
    await prisma.notification.deleteMany({ where: { utilisateur_id: id_utilisateur } });

    // 4. Supprimer l'utilisateur
    await prisma.utilisateur.delete({ where: { id_utilisateur } });

    res.status(200).json({
      success: true,
      message: "Utilisateur supprimé avec succès (ainsi que ses trajets et réservations).",
      links: {
        create: {
          href: `/api/auth/register`,
          method: "POST"
        },
        list: {
          href: `/api/users`,
          method: "GET"
        }
      }
    });
  } catch (err) {
    console.error("Erreur deleteUser:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la suppression." });
  }
};

// ────────────────────────────────
// ADMINISTRATEUR
// ────────────────────────────────

exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.utilisateur.findMany({
      select: {
        id_utilisateur: true,
        nom: true,
        email: true,
        role: true,
        photo_profil: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: users.map(user => ({
        ...user,
        _links: generateUserLinks(user)
      }))
    });
  } catch (err) {
    console.error("Erreur getAllUsers:", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

exports.editUserByAdmin = async (req, res) => {
  const { id } = req.params;
  const { nom, email, mot_de_passe, role } = req.body;

  try {
    const emailExists = await prisma.utilisateur.findFirst({
      where: {
        email,
        NOT: { id_utilisateur: parseInt(id) }
      }
    });
    if (emailExists) {
      return res.status(409).json({ success: false, message: "Cet email est déjà utilisé." });
    }

    const updateData = { nom, email, role };

    if (mot_de_passe) {
      const hashed = await bcrypt.hash(mot_de_passe, 10);
      updateData.mot_de_passe = hashed;
    }

    const updatedUser = await prisma.utilisateur.update({
      where: { id_utilisateur: parseInt(id) },
      data: updateData,
      select: {
        id_utilisateur: true,
        nom: true,
        email: true,
        role: true
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        ...updatedUser,
        links: generateUserLinks(updatedUser)
      }
    });
  } catch (err) {
    console.error("Erreur editUserByAdmin:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la mise à jour." });
  }
};

exports.deleteUserByAdmin = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id_utilisateur;

  try {
    if (parseInt(id) === 2) {
      return res.status(403).json({ success: false, message: "Impossible de supprimer le super administrateur." });
    }

    if (parseInt(id) === adminId) {
      return res.status(403).json({ success: false, message: "Vous ne pouvez pas vous supprimer vous-même." });
    }

    await prisma.utilisateur.delete({
      where: { id_utilisateur: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: "Utilisateur supprimé avec succès.",
      links: {
        create: {
          href: `/api/auth/register`,
          method: "POST"
        },
        list: {
          href: `/api/users`,
          method: "GET"
        }
      }
    });
  } catch (err) {
    console.error("Erreur deleteUserByAdmin:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la suppression." });
  }
};

function generateUserLinks(user) {
  return {
    self: {
      href: `/api/users/${user.id_utilisateur}`,
      method: "GET"
    },
    update: {
      href: `/api/users/${user.id_utilisateur}`,
      method: "PATCH"
    },
    delete: {
      href: `/api/users/${user.id_utilisateur}`,
      method: "DELETE"
    }
  };
}
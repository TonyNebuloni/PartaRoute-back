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

    // Notifier l'utilisateur modifié
    await prisma.notification.create({
      data: {
        utilisateur_id: updatedUser.id_utilisateur,
        type: 'generique',
        contenu_message: "Votre profil a été modifié par un administrateur."
      }
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

    // Suppression complète de tout ce qui dépend de l'utilisateur à supprimer
    const userToDelete = await prisma.utilisateur.findUnique({ where: { id_utilisateur: parseInt(id) } });
    if (userToDelete) {
      const userId = userToDelete.id_utilisateur;

      // 1. Notifications où il est destinataire
      await prisma.notification.deleteMany({ where: { utilisateur_id: userId } });

      // 2. Notifications liées à ses réservations (en tant que passager)
      const reservationsAsPassenger = await prisma.reservation.findMany({ where: { passager_id: userId } });
      const reservationIdsAsPassenger = reservationsAsPassenger.map(r => r.id_reservation);
      if (reservationIdsAsPassenger.length > 0) {
        await prisma.notification.deleteMany({ where: { reservation_id: { in: reservationIdsAsPassenger } } });
      }

      // 3. Notifications liées aux réservations de ses trajets (en tant que conducteur)
      const trajets = await prisma.trajet.findMany({ where: { conducteur_id: userId } });
      const trajetIds = trajets.map(t => t.id_trajet);
      if (trajetIds.length > 0) {
        const reservationsOfTrajets = await prisma.reservation.findMany({ where: { trajet_id: { in: trajetIds } } });
        const reservationIdsOfTrajets = reservationsOfTrajets.map(r => r.id_reservation);
        if (reservationIdsOfTrajets.length > 0) {
          await prisma.notification.deleteMany({ where: { reservation_id: { in: reservationIdsOfTrajets } } });
          // 5. Supprimer les réservations sur ses trajets
          await prisma.reservation.deleteMany({ where: { id_reservation: { in: reservationIdsOfTrajets } } });
        }
        // 6. Supprimer les trajets
        await prisma.trajet.deleteMany({ where: { id_trajet: { in: trajetIds } } });
      }

      // 4. Supprimer les réservations où il est passager
      if (reservationIdsAsPassenger.length > 0) {
        await prisma.reservation.deleteMany({ where: { id_reservation: { in: reservationIdsAsPassenger } } });
      }

      // 7. Supprimer l'utilisateur
      await prisma.utilisateur.delete({ where: { id_utilisateur: userId } });
    }

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
    console.error("Erreur deleteUserByAdmin:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la suppression." });
  }
};

exports.promoteToAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedUser = await prisma.utilisateur.update({
      where: { id_utilisateur: parseInt(id) },
      data: { role: 'admin' },
      select: { id_utilisateur: true, nom: true, email: true, role: true }
    });
    res.status(200).json({ success: true, data: updatedUser });
  } catch (err) {
    console.error("Erreur promoteToAdmin:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la promotion." });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await prisma.utilisateur.count();
    const totalTrips = await prisma.trajet.count();
    const totalReservations = await prisma.reservation.count();
    const totalAdmins = await prisma.utilisateur.count({ where: { role: 'admin' } });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalTrips,
        totalReservations,
        totalAdmins
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur lors de la récupération des stats." });
  }
};

exports.getAllTrips = async (req, res) => {
  try {
    const trips = await prisma.trajet.findMany({
      include: {
        conducteur: { select: { id_utilisateur: true, nom: true, email: true } }
      }
    });
    res.json({ success: true, data: trips });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur lors de la récupération des trajets." });
  }
};

exports.deleteTrip = async (req, res) => {
  const { id } = req.params;
  try {
    // Récupérer le trajet et ses infos avant suppression
    const trajet = await prisma.trajet.findUnique({
      where: { id_trajet: parseInt(id) },
      include: { conducteur: true, reservations: true }
    });
    if (!trajet) {
      return res.status(404).json({ success: false, message: "Trajet non trouvé." });
    }
    // Notifier le conducteur
    await prisma.notification.create({
      data: {
        utilisateur_id: trajet.conducteur_id,
        type: 'annulation',
        contenu_message: "Votre trajet a été supprimé par un administrateur."
      }
    });
    // Notifier tous les passagers
    for (const reservation of trajet.reservations) {
      await prisma.notification.create({
        data: {
          utilisateur_id: reservation.passager_id,
          reservation_id: reservation.id_reservation,
          type: 'annulation',
          contenu_message: "Un trajet auquel vous étiez inscrit a été annulé par un administrateur."
        }
      });
    }
    // Supprimer les notifications liées aux réservations de ce trajet
    await prisma.notification.deleteMany({ where: { reservation: { trajet_id: parseInt(id) } } });
    // Supprimer les réservations liées à ce trajet
    await prisma.reservation.deleteMany({ where: { trajet_id: parseInt(id) } });
    // Supprimer le trajet
    await prisma.trajet.delete({ where: { id_trajet: parseInt(id) } });
    res.json({ success: true, message: "Trajet supprimé et notifications envoyées." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur lors de la suppression du trajet." });
  }
};

exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        passager: { select: { id_utilisateur: true, nom: true, email: true } },
        trajet: {
          include: { conducteur: { select: { id_utilisateur: true, nom: true, email: true } } }
        }
      }
    });
    res.json({ success: true, data: reservations });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur lors de la récupération des réservations." });
  }
};

exports.deleteReservation = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Récupérer la réservation avant suppression
    const reservation = await prisma.reservation.findUnique({
      where: { id_reservation: parseInt(id) },
      include: { trajet: true }
    });

    if (!reservation) {
      return res.status(404).json({ success: false, message: "Réservation non trouvée." });
    }

    // 2. Supprimer les notifications liées à cette réservation
    await prisma.notification.deleteMany({ where: { reservation_id: parseInt(id) } });

    // 3. Supprimer la réservation
    await prisma.reservation.delete({ where: { id_reservation: parseInt(id) } });

    // 4. Créer une notification pour le passager
    await prisma.notification.create({
      data: {
        utilisateur_id: reservation.passager_id,
        reservation_id: reservation.id_reservation,
        type: 'annulation',
        contenu_message: "Votre réservation a été annulée par un administrateur."
      }
    });
    // 5. Créer une notification pour le conducteur
    if (reservation.trajet) {
      await prisma.notification.create({
        data: {
          utilisateur_id: reservation.trajet.conducteur_id,
          reservation_id: reservation.id_reservation,
          type: 'annulation',
          contenu_message: "Une réservation sur votre trajet a été annulée par un administrateur."
        }
      });
    }

    res.json({ success: true, message: "Réservation supprimée et notifications envoyées." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur lors de la suppression de la réservation." });
  }
};

exports.createUser = async (req, res) => {
  const { nom, email, mot_de_passe, photo_profil } = req.body;
  try {
    const emailExists = await prisma.utilisateur.findFirst({ where: { email } });
    if (emailExists) {
      return res.status(409).json({ success: false, message: "Cet email est déjà utilisé." });
    }
    const hashed = await bcrypt.hash(mot_de_passe, 10);
    const user = await prisma.utilisateur.create({
      data: {
        nom,
        email,
        mot_de_passe: hashed,
        photo_profil: photo_profil || '/uploads/profile_photos/default.jpg',
        role: 'user',
        date_inscription: new Date()
      }
    });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    console.error("Erreur createUser:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la création de l'utilisateur." });
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
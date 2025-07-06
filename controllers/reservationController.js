const prisma = require("../prisma/prisma");
const notificationService = require("../services/notificationService");

// Create a new reservation
exports.createReservation = async (req, res) => {
  try {
    const { trajet_id } = req.body;
    const utilisateur = req.user;

    // Validation basique
    if (!trajet_id) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant du trajet (trajet_id) doit être fourni.",
      });
    }

    // Vérification que le trajet existe et qu'il y a des places disponibles
    const trajet = await prisma.trajet.findUnique({
      where: { id_trajet: parseInt(trajet_id) },
      include: { reservations: { select: { statut: true } } },
    });

    // Vérification de l'existence du trajet et des places disponibles
    if (!trajet) {
      return res.status(404).json({
        success: false,
        message: "Trajet non trouvé.",
      });
    }

    // On compte seulement les réservations acceptées
    const nbReservationsAcceptees = trajet.reservations.filter(
      (r) => r.statut === "acceptee"
    ).length;
    if (trajet.places_disponibles <= nbReservationsAcceptees) {
      return res.status(400).json({
        success: false,
        message: "Aucune place disponible pour ce trajet.",
      });
    }

    // Vérifier que l'utilisateur ne réserve pas son propre trajet
    if (trajet.conducteur_id === utilisateur.id_utilisateur) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez pas réserver votre propre trajet.",
      });
    }

    // Vérifier si l'utilisateur a déjà une réservation sur ce trajet
    const reservationExistante = await prisma.reservation.findFirst({
      where: {
        trajet_id: trajet.id_trajet,
        passager_id: utilisateur.id_utilisateur,
        statut: { not: "annulee" },
      },
    });

    if (reservationExistante) {
      return res.status(409).json({
        success: false,
        message: "Vous avez déjà une réservation en cours pour ce trajet.",
      });
    }

    // Création de la réservation
    const reservation = await prisma.reservation.create({
      data: {
        trajet_id: trajet.id_trajet,
        passager_id: utilisateur.id_utilisateur,
        statut: "en_attente",
      },
      include: {
        trajet: true,
      },
    });

    // Création de la notification pour le conducteur
    await notificationService.createNotification({
      utilisateur_id: trajet.conducteur_id,
      reservation_id: reservation.id_reservation,
      type: "demande_reservation",
      contenu_message: `Nouvelle demande de réservation pour votre trajet de ${trajet.ville_depart} à ${trajet.ville_arrivee}.`,
    });

    return res.status(201).json({
      success: true,
      message: "Réservation créée avec succès.",
      data: {
        ...reservation,
        links: generateReservationLinks(reservation),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la création de la réservation :", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne lors de la création de la réservation.",
    });
  }
};

// Get all reservations for a user
exports.getReservations = async (req, res) => {
  try {
    const utilisateur = req.user;
    const { search, date, page = 1, limit = 10 } = req.query;

    const filters = {
      passager_id: utilisateur.id_utilisateur,
    };

    if (search) {
      filters.trajet = {
        OR: [
          { ville_depart: { contains: search, mode: "insensitive" } },
          { ville_arrivee: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    if (date) {
      const parsedDate = new Date(date);
      const nextDay = new Date(parsedDate);
      nextDay.setDate(parsedDate.getDate() + 1);

      filters.date_reservation = {
        gte: parsedDate,
        lt: nextDay,
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where: filters,
        include: {
          trajet: {
            include: {
              conducteur: true,
            },
          },
          passager: true,
        },
        skip,
        take,
      }),
      prisma.reservation.count({ where: filters }),
    ]);

    return res.status(200).json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      data: reservations.map((reservation) => ({
        ...reservation,
        links: generateReservationLinks(reservation),
      })),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des réservations :", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne lors de la récupération des réservations.",
      error: error.message,
    });
  }
};

// Valider ou refuser une reservation
exports.changeStatutReservation = async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id, 10);
    const { statut } = req.body;
    const utilisateur = req.user;

    // Vérification du statut demandé
    if (!["acceptee", "refusee"].includes(statut)) {
      return res.status(400).json({
        success: false,
        message: "Statut invalide. Utilisez 'acceptee' ou 'refusee'.",
      });
    }

    // Récupérer la réservation avec le trajet et le conducteur
    const reservation = await prisma.reservation.findUnique({
      where: { id_reservation: reservationId },
      include: { trajet: true },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée.",
      });
    }

    // Vérifier que l'utilisateur est bien le conducteur du trajet
    if (reservation.trajet.conducteur_id !== utilisateur.id_utilisateur) {
      return res.status(403).json({
        success: false,
        message: "Seul le conducteur peut changer le statut de la réservation.",
      });
    }

    // Seules les réservations en attente peuvent être modifiées
    if (reservation.statut !== "en_attente") {
      return res.status(400).json({
        success: false,
        message: "Seules les réservations en attente peuvent être modifiées.",
      });
    }

    // Transaction : acceptation = décrémentation des places, refus = rien
    let updatedReservation,
      updatedTrajet = null;

    if (statut === "acceptee") {
      // Vérifier qu'il reste des places
      if (reservation.trajet.places_disponibles < 1) {
        return res.status(400).json({
          success: false,
          message: "Aucune place disponible pour accepter cette réservation.",
        });
      }

      [updatedReservation, updatedTrajet] = await prisma.$transaction([
        prisma.reservation.update({
          where: { id_reservation: reservationId },
          data: { statut: "acceptee" },
        }),
        prisma.trajet.update({
          where: { id_trajet: reservation.trajet_id },
          data: { places_disponibles: { decrement: 1 } },
        }),
      ]);

      // Création de la notification pour le passager (acceptée)
      await notificationService.createNotification({
        utilisateur_id: reservation.passager_id,
        reservation_id: reservation.id_reservation,
        type: "confirmation",
        contenu_message: `Votre réservation pour le trajet de ${reservation.trajet.ville_depart} à ${reservation.trajet.ville_arrivee} a été acceptée.`,
      });
    } else {
      // Refus = juste le statut
      updatedReservation = await prisma.reservation.update({
        where: { id_reservation: reservationId },
        data: { statut: "refusee" },
      });

      // Création de la notification pour le passager (refusée)
      await notificationService.createNotification({
        utilisateur_id: reservation.passager_id,
        reservation_id: reservation.id_reservation,
        type: "refus",
        contenu_message: `Votre réservation pour le trajet de ${reservation.trajet.ville_depart} à ${reservation.trajet.ville_arrivee} a été refusée.`,
      });
    }

    return res.status(200).json({
      success: true,
      reservation: updatedReservation,
      trajet: updatedTrajet,
      links: generateReservationLinks(updatedReservation),
    });
  } catch (error) {
    console.error(
      "Erreur lors du changement de statut de la réservation :",
      error
    );
    res.status(500).json({
      success: false,
      message: "Erreur interne lors du changement de statut.",
    });
  }
};

exports.cancelReservation = async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id, 10);
    const utilisateur = req.user;

    // Récupérer la réservation avec le passager et le trajet
    const reservation = await prisma.reservation.findUnique({
      where: { id_reservation: reservationId },
      include: { trajet: true },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée.",
      });
    }

    // Vérifier que l'utilisateur est le passager qui a créé la réservation
    if (reservation.passager_id !== utilisateur.id_utilisateur) {
      return res.status(403).json({
        success: false,
        message: "Seul le passager peut annuler sa réservation.",
      });
    }

    // Vérifier que le statut permet l'annulation
    if (["annulee", "refusee"].includes(reservation.statut)) {
      return res.status(400).json({
        success: false,
        message: "Cette réservation ne peut pas être annulée.",
      });
    }

    let updatedReservation,
      updatedTrajet = null;

    if (reservation.statut === "acceptee") {
      // Annulation d'une réservation acceptée : on réincrémente les places
      [updatedReservation, updatedTrajet] = await prisma.$transaction([
        prisma.reservation.update({
          where: { id_reservation: reservationId },
          data: { statut: "annulee" },
        }),
        prisma.trajet.update({
          where: { id_trajet: reservation.trajet_id },
          data: { places_disponibles: { increment: 1 } },
        }),
      ]);
    } else {
      // Annulation d'une réservation en attente (pas besoin de changer les places)
      updatedReservation = await prisma.reservation.update({
        where: { id_reservation: reservationId },
        data: { statut: "annulee" },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Réservation annulée.",
      reservation: updatedReservation,
      trajet: updatedTrajet,
      links: generateReservationLinks(updatedReservation),
    });
  } catch (error) {
    console.error("Erreur lors de l'annulation de la réservation :", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne lors de l'annulation de la réservation.",
    });
  }
};

// GET /conducteur/reservations : réservations pour les trajets dont l'utilisateur est conducteur
exports.getReservationsForDriver = async (req, res) => {
  try {
    const utilisateur = req.user;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    // On récupère toutes les réservations dont le trajet a pour conducteur l'utilisateur connecté
    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where: {
          trajet: {
            conducteur_id: utilisateur.id_utilisateur,
          },
        },
        include: {
          trajet: true,
          passager: true,
        },
        skip,
        take,
      }),
      prisma.reservation.count({
        where: {
          trajet: {
            conducteur_id: utilisateur.id_utilisateur,
          },
        },
      }),
    ]);
    return res.status(200).json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      data: reservations.map((r) => ({
        id_reservation: r.id_reservation,
        statut: r.statut,
        trajet: r.trajet,
        passager: r.passager,
      })),
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des réservations conducteur :",
      error
    );
    res.status(500).json({
      success: false,
      message:
        "Erreur interne lors de la récupération des réservations conducteur.",
    });
  }
};

// GET /:id : récupérer une réservation précise
exports.getReservationById = async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id, 10);
    const reservation = await prisma.reservation.findUnique({
      where: { id_reservation: reservationId },
      include: { trajet: true, passager: true },
    });
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée.",
      });
    }
    return res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur interne lors de la récupération de la réservation.",
      error: error.message,
    });
  }
};

function generateReservationLinks(reservation) {
  return {
    self: {
      href: `/api/reservations/${reservation.id_reservation}`,
      method: "GET",
    },
    cancel: {
      href: `/api/reservations/${reservation.id_reservation}/cancel`,
      method: "PATCH",
    },
    trajet: {
      href: `/api/trajets/${reservation.trajet_id}`,
      method: "GET",
    },
  };
}

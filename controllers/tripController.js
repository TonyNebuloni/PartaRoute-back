const prisma = require('../prisma/prisma');
const notificationService = require('../services/notificationService');

exports.createTrip = async (req, res) => {
  try {
    const {
      ville_depart,
      ville_arrivee,
      date_heure_depart,
      places_disponibles,
      prix,
      conditions,
    } = req.body;

    const user = req.user;

    if (!ville_depart || !ville_arrivee || !date_heure_depart || !places_disponibles || !prix) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    if (isNaN(parseInt(places_disponibles)) || isNaN(parseFloat(prix))) {
      return res.status(400).json({
        success: false,
        message: "Places and price must be valid numbers.",
      });
    }

    const trip = await prisma.trajet.create({
      data: {
        conducteur_id: user.id_utilisateur,
        ville_depart,
        ville_arrivee,
        date_heure_depart: new Date(date_heure_depart),
        places_disponibles: parseInt(places_disponibles),
        prix: parseFloat(prix),
        conditions: conditions || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Trip created successfully.",
      data: {
        ...trip,
        links: generateTripLinks(trip)
      },
    });
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while creating trip.",
    });
  }
};

exports.getTrips = async (req, res) => {
  try {
    const { ville_depart, ville_arrivee, date, page = 1, limit = 10 } = req.query;

    const filters = {};

    if (ville_depart) {
      filters.ville_depart = { contains: ville_depart };
    }

    if (ville_arrivee) {
      filters.ville_arrivee = { contains: ville_arrivee };
    }

    if (date) {
      const parsedDate = new Date(date);
      const nextDay = new Date(parsedDate);
      nextDay.setDate(parsedDate.getDate() + 1);

      filters.date_heure_depart = {
        gte: parsedDate,
        lt: nextDay,
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [trips, total] = await Promise.all([
      prisma.trajet.findMany({
        where: filters,
        include: {
          conducteur: {
            select: {
              id_utilisateur: true,
              nom: true,
              photo_profil: true,
            },
          },
        },
        orderBy: { date_heure_depart: "asc" },
        skip,
        take
      }),
      prisma.trajet.count({ where: filters })
    ]);

    res.status(200).json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      data: trips.map(trip => ({
        ...trip,
        links: generateTripLinks(trip)
      })),
    });
  } catch (err) {
    console.error("Error retrieving trips:", err);
    res.status(500).json({
      success: false,
      message: "Internal error retrieving trips.",
    });
  }
};

exports.updateTrip = async (req, res) => {
  const tripId = parseInt(req.params.id);
  const user = req.user;

  const {
    ville_depart,
    ville_arrivee,
    date_heure_depart,
    places_disponibles,
    prix,
    conditions,
  } = req.body;

  try {
    const trip = await prisma.trajet.findUnique({
      where: { id_trajet: tripId },
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found." });
    }

    if (trip.conducteur_id !== user.id_utilisateur) {
      return res.status(403).json({ success: false, message: "Unauthorized to modify this trip." });
    }

    const data = {};
    if (ville_depart) data.ville_depart = ville_depart;
    if (ville_arrivee) data.ville_arrivee = ville_arrivee;
    if (date_heure_depart) data.date_heure_depart = new Date(date_heure_depart);
    if (places_disponibles) data.places_disponibles = parseInt(places_disponibles);
    if (prix) data.prix = parseFloat(prix);
    if (conditions) data.conditions = conditions;

    const updatedTrip = await prisma.trajet.update({
      where: { id_trajet: tripId },
      data,
    });

    return res.status(200).json({
      success: true,
      message: "Trip updated successfully.",
      data: {
        ...updatedTrip,
        links: generateTripLinks(updatedTrip)
      },
    });
  } catch (error) {
    console.error("Error updating trip:", error);
    res.status(500).json({
      success: false,
      message: "Internal error updating trip.",
    });
  }
};

exports.deleteTrip = async (req, res) => {
  const tripId = parseInt(req.params.id);
  const user = req.user;

  try {
    const trip = await prisma.trajet.findUnique({
      where: { id_trajet: tripId },
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found." });
    }

    if (trip.conducteur_id !== user.id_utilisateur) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this trip." });
    }

    // Récupérer toutes les réservations liées au trajet
    const reservations = await prisma.reservation.findMany({
      where: { trajet_id: tripId },
      include: { passager: true }
    });

    // Notifier chaque passager de l'annulation
    for (const reservation of reservations) {
      await notificationService.createNotification({
        utilisateur_id: reservation.passager_id,
        reservation_id: reservation.id_reservation,
        type: 'annulation',
        contenu_message: `Votre réservation pour le trajet de ${trip.ville_depart} à ${trip.ville_arrivee} a été annulée car le trajet a été supprimé.`
      });
    }

    // Supprimer toutes les réservations liées au trajet
    await prisma.reservation.deleteMany({
      where: { trajet_id: tripId }
    });

    // Supprimer le trajet
    await prisma.trajet.delete({
      where: { id_trajet: tripId }
    });

    return res.status(200).json({
      success: true,
      message: "Trip deleted successfully.",
      links: {
        trips: { href: "/api/trips", method: "GET" },
        create: { href: "/api/trips", method: "POST" }
      }
    });
  } catch (error) {
    console.error("Error deleting trip:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting trip.",
    });
  }
};

function generateTripLinks(trip) {
  return {
    self: {
      href: `/api/trips/${trip.id_trajet}`,
      method: "GET",
    },
    update: {
      href: `/api/trips/${trip.id_trajet}`,
      method: "PATCH",
    },
    delete: {
      href: `/api/trips/${trip.id_trajet}`,
      method: "DELETE",
    },
    createReservation: {
      href: `/api/reservations`,
      method: "POST",
      body: { trajet_id: trip.id_trajet }
    }
  };
}

// GET /conducteur/trajets : liste des trajets proposés par le conducteur connecté
exports.getTripsForDriver = async (req, res) => {
    try {
        const utilisateur = req.user;
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const [trips, total] = await Promise.all([
            prisma.trajet.findMany({
                where: {
                    conducteur_id: utilisateur.id_utilisateur
                },
                include: {
                    reservations: {
                        include: { passager: true }
                    }
                },
                skip,
                take
            }),
            prisma.trajet.count({
                where: {
                    conducteur_id: utilisateur.id_utilisateur
                }
            })
        ]);
        return res.status(200).json({
            success: true,
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            data: trips
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des trajets du conducteur :", error);
        res.status(500).json({
            success: false,
            message: "Erreur interne lors de la récupération des trajets du conducteur."
        });
    }
};

// GET /trips/:id : récupérer un trajet précis
exports.getTripById = async (req, res) => {
    try {
        const tripId = parseInt(req.params.id, 10);
        const trip = await prisma.trajet.findUnique({
            where: { id_trajet: tripId },
            include: {
                conducteur: true,
                reservations: {
                    include: { passager: true }
                }
            }
        });
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trajet non trouvé."
            });
        }
        return res.status(200).json({
            success: true,
            data: trip
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur interne lors de la récupération du trajet.",
            error: error.message
        });
    }
};

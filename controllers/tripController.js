const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
      data: trip,
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
    const { ville_depart, ville_arrivee, date } = req.query;

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

    const trips = await prisma.trajet.findMany({
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
    });

    res.status(200).json({
      success: true,
      message: `${trips.length} trip(s) found.`,
      data: trips,
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
      data: updatedTrip,
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

    await prisma.trajet.delete({
      where: { id_trajet: tripId },
    });

    return res.status(200).json({
      success: true,
      message: "Trip deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting trip:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting trip.",
    });
  }
};

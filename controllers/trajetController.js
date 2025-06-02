const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.creerTrajet = async (req, res) => {
  try {
    const {
      ville_depart,
      ville_arrivee,
      date_heure_depart,
      places_disponibles,
      prix,
      conditions,
    } = req.body;

    const utilisateur = req.user;

    // Validation basique
    if (!ville_depart || !ville_arrivee || !date_heure_depart || !places_disponibles || !prix) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs requis (ville_depart, ville_arrivee, date_heure_depart, places_disponibles, prix) doivent être fournis.",
      });
    }

    // Validation des types
    if (isNaN(parseInt(places_disponibles)) || isNaN(parseFloat(prix))) {
      return res.status(400).json({
        success: false,
        message: "Le nombre de places et le prix doivent être des nombres valides.",
      });
    }

    // Création du trajet
    const trajet = await prisma.trajet.create({
      data: {
        conducteur_id: utilisateur.id_utilisateur,
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
      message: "Trajet créé avec succès.",
      data: trajet,
    });
  } catch (error) {
    console.error("Erreur lors de la création du trajet :", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne lors de la création du trajet.",
    });
  }
};

exports.getTrajets = async (req, res) => {
    try {
      const { ville_depart, ville_arrivee, date } = req.query;
  
      const filtres = {};
  
      if (ville_depart) {
        filtres.ville_depart = {
          contains: ville_depart,
        };
      }
  
      if (ville_arrivee) {
        filtres.ville_arrivee = {
          contains: ville_arrivee,
        };
      }
  
      if (date) {
        const parsedDate = new Date(date);
        const nextDay = new Date(parsedDate);
        nextDay.setDate(parsedDate.getDate() + 1);
  
        filtres.date_heure_depart = {
          gte: parsedDate,
          lt: nextDay,
        };
      }
  
      const trajets = await prisma.trajet.findMany({
        where: filtres,
        include: {
          conducteur: {
            select: { id_utilisateur: true, nom: true, photo_profil: true }
          }
        },
        orderBy: { date_heure_depart: 'asc' }
      });
  
      res.status(200).json({
        success: true,
        message: `${trajets.length} trajet(s) trouvé(s).`,
        data: trajets,
      });
    } catch (err) {
      console.error("Erreur lors de la récupération des trajets :", err);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération des trajets.",
      });
    }
  };
  
  

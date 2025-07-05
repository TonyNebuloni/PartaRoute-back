const { PrismaClient } = require("@prisma/client");
const { faker } = require("@faker-js/faker");
const prisma = new PrismaClient();

// Configuration de Faker pour utiliser la localisation française
faker.locale = "fr";

// Liste des villes françaises populaires
const VILLES_FRANCAISES = [
  "Paris",
  "Lyon",
  "Marseille",
  "Toulouse",
  "Nice",
  "Nantes",
  "Bordeaux",
  "Lille",
  "Montpellier",
  "Strasbourg",
  "Rennes",
  "Reims",
  "Saint-Étienne",
  "Toulon",
  "Le Havre",
  "Grenoble",
  "Dijon",
  "Angers",
  "Nîmes",
  "Villeurbanne",
  "Clermont-Ferrand",
  "Aix-en-Provence",
  "Brest",
  "Tours",
  "Amiens",
  "Limoges",
  "Annecy",
  "Perpignan",
  "Boulogne-Billancourt",
  "Orléans",
  "Mulhouse",
  "Rouen",
  "Caen",
  "Nancy",
  "Argenteuil",
  "Cannes",
  "Antibes",
  "Monaco",
  "Grasse",
];

// Noms français typiques
const PRENOMS_FRANCAIS = [
  "Alice",
  "Bob",
  "Chloé",
  "David",
  "Emma",
  "François",
  "Gabrielle",
  "Hugo",
  "Isabelle",
  "Jean",
  "Karine",
  "Louis",
  "Marie",
  "Nicolas",
  "Olivia",
  "Pierre",
  "Quentin",
  "Rachel",
  "Sophie",
  "Thomas",
  "Valérie",
  "William",
  "Xavier",
  "Yves",
  "Zoé",
];

const NOMS_FRANCAIS = [
  "Martin",
  "Bernard",
  "Dubois",
  "Thomas",
  "Robert",
  "Richard",
  "Petit",
  "Durand",
  "Leroy",
  "Moreau",
  "Simon",
  "Laurent",
  "Lefebvre",
  "Michel",
  "Garcia",
  "David",
  "Bertrand",
  "Roux",
  "Vincent",
  "Fournier",
  "Morel",
  "Girard",
  "André",
  "Lefèvre",
  "Mercier",
  "Dupont",
  "Lambert",
  "Bonnet",
  "François",
  "Martinez",
];

// Fonction pour générer un nom français complet
function generateFrenchName() {
  const prenom = faker.helpers.arrayElement(PRENOMS_FRANCAIS);
  const nom = faker.helpers.arrayElement(NOMS_FRANCAIS);
  return `${prenom} ${nom}`;
}

// Fonction pour sélectionner une ville française aléatoire
function getRandomFrenchCity() {
  return faker.helpers.arrayElement(VILLES_FRANCAISES);
}

async function main() {
  // Supprime toutes les données existantes (ordre important)
  await prisma.notification.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.trajet.deleteMany();
  await prisma.utilisateur.deleteMany();

  // Supprime l'admin existant si présent
  await prisma.utilisateur.deleteMany({
    where: { email: "admin@example.com" },
  });
  // Crée un admin
  const admin = await prisma.utilisateur.create({
    data: {
      nom: "Admin PartaRoute",
      email: "admin@example.com",
      mot_de_passe: "adminpassword",
      photo_profil: faker.image.avatar(),
      role: "admin",
    },
  });

  // Crée des utilisateurs avec des noms français
  const users = [admin];
  for (let i = 0; i < 15; i++) {
    users.push(
      await prisma.utilisateur.create({
        data: {
          nom: generateFrenchName(),
          email: faker.internet.email(),
          mot_de_passe: faker.internet.password(),
          photo_profil: faker.image.avatar(),
          role: "user",
        },
      })
    );
  }

  // Crée des trajets avec des villes françaises
  const trajets = [];
  const trajetsPlacesInit = [];
  for (let i = 0; i < 30; i++) {
    const placesInit = faker.number.int({ min: 1, max: 5 });
    const ville_depart = getRandomFrenchCity();
    let ville_arrivee = getRandomFrenchCity();

    // S'assurer que la ville d'arrivée est différente de la ville de départ
    while (ville_arrivee === ville_depart) {
      ville_arrivee = getRandomFrenchCity();
    }

    trajets.push(
      await prisma.trajet.create({
        data: {
          conducteur_id:
            users[faker.number.int({ min: 0, max: users.length - 1 })]
              .id_utilisateur,
          ville_depart,
          ville_arrivee,
          date_heure_depart: faker.date.soon({ days: 30 }), // Trajets dans les 30 prochains jours
          places_disponibles: placesInit,
          prix: parseFloat(
            faker.number
              .float({ min: 15, max: 120, precision: 0.01 })
              .toFixed(2)
          ),
          conditions: {},
        },
      })
    );
    trajetsPlacesInit.push(placesInit);
  }

  // Crée des réservations cohérentes
  const reservations = [];
  for (let i = 0; i < trajets.length; i++) {
    const trajet = trajets[i];
    const placesInit = trajetsPlacesInit[i];
    // Nombre de réservations acceptées (max placesInit)
    const nbAcceptee = faker.number.int({ min: 0, max: placesInit });
    const passagersUtilises = new Set();
    // Génère les réservations acceptées
    for (let j = 0; j < nbAcceptee; j++) {
      let passager;
      do {
        passager = users[faker.number.int({ min: 0, max: users.length - 1 })];
      } while (
        passager.id_utilisateur === trajet.conducteur_id ||
        passagersUtilises.has(passager.id_utilisateur)
      );
      passagersUtilises.add(passager.id_utilisateur);
      reservations.push(
        await prisma.reservation.create({
          data: {
            trajet_id: trajet.id_trajet,
            passager_id: passager.id_utilisateur,
            statut: "acceptee",
          },
        })
      );
    }
    // Génère quelques réservations en attente/refusée/annulée
    const nbAutres = faker.number.int({ min: 0, max: 2 });
    for (let j = 0; j < nbAutres; j++) {
      let passager;
      do {
        passager = users[faker.number.int({ min: 0, max: users.length - 1 })];
      } while (
        passager.id_utilisateur === trajet.conducteur_id ||
        passagersUtilises.has(passager.id_utilisateur)
      );
      passagersUtilises.add(passager.id_utilisateur);
      const statut = faker.helpers.arrayElement([
        "en_attente",
        "refusee",
        "annulee",
      ]);
      reservations.push(
        await prisma.reservation.create({
          data: {
            trajet_id: trajet.id_trajet,
            passager_id: passager.id_utilisateur,
            statut,
          },
        })
      );
    }
    // Met à jour les places_disponibles du trajet
    await prisma.trajet.update({
      where: { id_trajet: trajet.id_trajet },
      data: { places_disponibles: placesInit - nbAcceptee },
    });
  }

  // Crée des notifications avec des messages en français
  const messages_francais = [
    "Votre demande de réservation a été acceptée !",
    "Nouvelle demande de réservation pour votre trajet",
    "Votre réservation a été confirmée",
    "Le conducteur a annulé le trajet",
    "Rappel : votre trajet est prévu demain",
    "Merci d'avoir utilisé PartaRoute !",
    "Votre trajet commence dans 2 heures",
    "N'oubliez pas de noter votre conducteur",
  ];

  for (let i = 0; i < 40; i++) {
    const user = users[faker.number.int({ min: 0, max: users.length - 1 })];
    const reservation =
      reservations[faker.number.int({ min: 0, max: reservations.length - 1 })];
    await prisma.notification.create({
      data: {
        utilisateur_id: user.id_utilisateur,
        reservation_id: reservation.id_reservation,
        type: faker.helpers.arrayElement([
          "demande_reservation",
          "confirmation",
          "refus",
          "annulation",
          "generique",
        ]),
        contenu_message: faker.helpers.arrayElement(messages_francais),
      },
    });
  }

  console.log(`✅ Données créées avec succès :`);
  console.log(`   - ${users.length} utilisateurs`);
  console.log(`   - ${trajets.length} trajets`);
  console.log(`   - ${reservations.length} réservations`);
  console.log(`   - 40 notifications`);
  console.log(`🇫🇷 Toutes les villes sont françaises !`);
}

main()
  .then(() => {
    console.log("🎉 Fake data inserted with French cities!");
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error("❌ Error:", e);
    return prisma.$disconnect();
  });

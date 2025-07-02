const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const prisma = new PrismaClient();

async function main() {
  // Supprime toutes les données existantes (ordre important)
  await prisma.notification.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.trajet.deleteMany();
  await prisma.utilisateur.deleteMany();

  // Supprime l'admin existant si présent
  await prisma.utilisateur.deleteMany({ where: { email: 'admin@example.com' } });
  // Crée un admin
  const admin = await prisma.utilisateur.create({
    data: {
      nom: 'Admin Test',
      email: 'admin@example.com',
      mot_de_passe: 'adminpassword',
      photo_profil: faker.image.avatar(),
      role: 'admin',
    }
  });

  // Crée des utilisateurs
  const users = [admin];
  for (let i = 0; i < 10; i++) {
    users.push(await prisma.utilisateur.create({
      data: {
        nom: faker.person.fullName(),
        email: faker.internet.email(),
        mot_de_passe: faker.internet.password(),
        photo_profil: faker.image.avatar(),
        role: 'user',
      }
    }));
  }

  // Crée des trajets
  const trajets = [];
  const trajetsPlacesInit = [];
  for (let i = 0; i < 20; i++) {
    const placesInit = faker.number.int({ min: 1, max: 5 });
    trajets.push(await prisma.trajet.create({
      data: {
        conducteur_id: users[faker.number.int({ min: 0, max: users.length - 1 })].id_utilisateur,
        ville_depart: faker.location.city(),
        ville_arrivee: faker.location.city(),
        date_heure_depart: faker.date.soon(),
        places_disponibles: placesInit,
        prix: parseFloat(faker.number.float({ min: 10, max: 100, precision: 0.01 }).toFixed(2)),
        conditions: {},
      }
    }));
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
      } while (passager.id_utilisateur === trajet.conducteur_id || passagersUtilises.has(passager.id_utilisateur));
      passagersUtilises.add(passager.id_utilisateur);
      reservations.push(await prisma.reservation.create({
        data: {
          trajet_id: trajet.id_trajet,
          passager_id: passager.id_utilisateur,
          statut: 'acceptee',
        }
      }));
    }
    // Génère quelques réservations en attente/refusée/annulée
    const nbAutres = faker.number.int({ min: 0, max: 2 });
    for (let j = 0; j < nbAutres; j++) {
      let passager;
      do {
        passager = users[faker.number.int({ min: 0, max: users.length - 1 })];
      } while (passager.id_utilisateur === trajet.conducteur_id || passagersUtilises.has(passager.id_utilisateur));
      passagersUtilises.add(passager.id_utilisateur);
      const statut = faker.helpers.arrayElement(['en_attente', 'refusee', 'annulee']);
      reservations.push(await prisma.reservation.create({
        data: {
          trajet_id: trajet.id_trajet,
          passager_id: passager.id_utilisateur,
          statut,
        }
      }));
    }
    // Met à jour les places_disponibles du trajet
    await prisma.trajet.update({
      where: { id_trajet: trajet.id_trajet },
      data: { places_disponibles: placesInit - nbAcceptee }
    });
  }

  // Crée des notifications
  for (let i = 0; i < 30; i++) {
    const user = users[faker.number.int({ min: 0, max: users.length - 1 })];
    const reservation = reservations[faker.number.int({ min: 0, max: reservations.length - 1 })];
    await prisma.notification.create({
      data: {
        utilisateur_id: user.id_utilisateur,
        reservation_id: reservation.id_reservation,
        type: faker.helpers.arrayElement(['demande_reservation', 'confirmation', 'refus', 'annulation', 'generique']),
        contenu_message: faker.lorem.sentence(),
      }
    });
  }
}

main()
  .then(() => {
    console.log('Fake data inserted!');
    return prisma.$disconnect();
  })
  .catch(e => {
    console.error(e);
    return prisma.$disconnect();
  }); 
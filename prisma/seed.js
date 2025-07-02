const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const prisma = new PrismaClient();

async function main() {
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
  for (let i = 0; i < 20; i++) {
    trajets.push(await prisma.trajet.create({
      data: {
        conducteur_id: users[faker.number.int({ min: 0, max: users.length - 1 })].id_utilisateur,
        ville_depart: faker.location.city(),
        ville_arrivee: faker.location.city(),
        date_heure_depart: faker.date.soon(),
        places_disponibles: faker.number.int({ min: 1, max: 5 }),
        prix: parseFloat(faker.number.float({ min: 10, max: 100, precision: 0.01 }).toFixed(2)),
        conditions: {},
      }
    }));
  }

  // Crée des réservations
  const reservations = [];
  for (let i = 0; i < 40; i++) {
    const trajet = trajets[faker.number.int({ min: 0, max: trajets.length - 1 })];
    let passager;
    do {
      passager = users[faker.number.int({ min: 0, max: users.length - 1 })];
    } while (passager.id_utilisateur === trajet.conducteur_id);

    reservations.push(await prisma.reservation.create({
      data: {
        trajet_id: trajet.id_trajet,
        passager_id: passager.id_utilisateur,
        statut: faker.helpers.arrayElement(['en_attente', 'acceptee', 'refusee', 'annulee']),
      }
    }));
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
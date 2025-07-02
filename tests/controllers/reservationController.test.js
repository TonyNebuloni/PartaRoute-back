const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
jest.mock('../../prisma/prisma');
const prisma = require('../../prisma/prisma');
const reservationController = require('../../controllers/reservationController');

const app = express();
app.use(bodyParser.json());

// Ajout des routes simulées avec utilisateur fictif
app.post('/reservations', (req, res, next) => {
    req.user = { id_utilisateur: 1 };
    next();
}, reservationController.createReservation);

app.get('/reservations', (req, res, next) => {
    req.user = { id_utilisateur: 1 };
    next();
}, reservationController.getReservations);

app.patch('/reservations/:id/statut', (req, res, next) => {
    req.user = { id_utilisateur: 10 }; // simulate conducteur
    next();
}, reservationController.changeStatutReservation);

app.delete('/reservations/:id', (req, res, next) => {
    req.user = { id_utilisateur: 1 };
    next();
}, reservationController.cancelReservation);

// Ajout de la route simulée pour le conducteur
app.get('/conducteur/reservations', (req, res, next) => {
    req.user = { id_utilisateur: 42 }; // simulate conducteur
    next();
}, reservationController.getReservationsForDriver);

// ============================
// TESTS
// ============================

beforeEach(() => {
    prisma.reservation.count = jest.fn().mockResolvedValue(1);
});

describe('POST /reservations', () => {
    it('devrait créer une réservation', async () => {
        prisma.trajet.findUnique.mockResolvedValue({
            id_trajet: 1,
            places_disponibles: 2,
            reservations: [],
            conducteur_id: 2
        });
        prisma.reservation.findFirst.mockResolvedValue(null);
        prisma.reservation.create.mockResolvedValue({ id_reservation: 1 });

        const res = await request(app).post('/reservations').send({ trajet_id: 1 });
        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
    });
});

describe('GET /reservations', () => {
    it('doit retourner la liste des réservations de l\'utilisateur', async () => {
        prisma.reservation.findMany.mockResolvedValue([{ id_reservation: 1 }]);

        const res = await request(app).get('/reservations');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
    });
});

describe('PATCH /reservations/:id/statut', () => {
    it('doit accepter une réservation en attente', async () => {
        prisma.reservation.findUnique.mockResolvedValue({
            id_reservation: 1,
            statut: 'en_attente',
            trajet: {
                conducteur_id: 10,
                places_disponibles: 2,
                id_trajet: 5,
                ville_depart: 'Paris',
                ville_arrivee: 'Lyon'
            },
            passager_id: 2
        });

        prisma.$transaction.mockResolvedValue([
            { id_reservation: 1, statut: 'acceptee' },
            { id_trajet: 5, places_disponibles: 1 }
        ]);
        prisma.notification.create.mockResolvedValue({});

        const res = await request(app)
            .patch('/reservations/1/statut')
            .send({ statut: 'acceptee' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.reservation).toBeDefined();
        expect(res.body.reservation.statut).toBe('acceptee');
    });
});

describe('DELETE /reservations/:id', () => {
    it('doit annuler une réservation acceptée', async () => {
        prisma.reservation.findUnique.mockResolvedValue({
            id_reservation: 1,
            passager_id: 1,
            statut: 'acceptee',
            trajet: {
                id_trajet: 5
            }
        });

        prisma.$transaction.mockResolvedValue([
            { id_reservation: 1, statut: 'annulee' },
            { id_trajet: 5, places_disponibles: 3 }
        ]);

        const res = await request(app).delete('/reservations/1');
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/Réservation annulée/);
    });
});

describe('GET /conducteur/reservations', () => {
    it('doit retourner les réservations pour les trajets du conducteur', async () => {
        prisma.reservation.findMany.mockResolvedValue([
            {
                id_reservation: 1,
                statut: 'en_attente',
                trajet: { id_trajet: 10, ville_depart: 'Paris', ville_arrivee: 'Lyon', conducteur_id: 42 },
                passager: { id_utilisateur: 2, nom: 'Alice' }
            },
            {
                id_reservation: 2,
                statut: 'acceptee',
                trajet: { id_trajet: 11, ville_depart: 'Lyon', ville_arrivee: 'Marseille', conducteur_id: 42 },
                passager: { id_utilisateur: 3, nom: 'Bob' }
            }
        ]);

        const res = await request(app).get('/conducteur/reservations');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(2);
        expect(res.body.data[0]).toHaveProperty('id_reservation');
        expect(res.body.data[0]).toHaveProperty('statut');
        expect(res.body.data[0]).toHaveProperty('trajet');
        expect(res.body.data[0]).toHaveProperty('passager');
        expect(res.body.data[0].trajet.conducteur_id).toBe(42);
    });
});

describe('POST /reservations - logique de places disponibles', () => {
    it('refuse la réservation si toutes les places sont déjà acceptées', async () => {
        prisma.trajet.findUnique.mockResolvedValue({
            id_trajet: 1,
            places_disponibles: 2,
            reservations: [
                { statut: 'acceptee' },
                { statut: 'acceptee' }
            ],
            conducteur_id: 2
        });
        prisma.reservation.findFirst.mockResolvedValue(null);
        const res = await request(app).post('/reservations').send({ trajet_id: 1 });
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Aucune place disponible/);
    });

    it('accepte la réservation si des réservations en attente existent mais pas assez d\'acceptées', async () => {
        prisma.trajet.findUnique.mockResolvedValue({
            id_trajet: 1,
            places_disponibles: 2,
            reservations: [
                { statut: 'acceptee' },
                { statut: 'en_attente' }
            ],
            conducteur_id: 2
        });
        prisma.reservation.findFirst.mockResolvedValue(null);
        prisma.reservation.create.mockResolvedValue({ id_reservation: 2 });
        const res = await request(app).post('/reservations').send({ trajet_id: 1 });
        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('accepte la réservation si aucune réservation', async () => {
        prisma.trajet.findUnique.mockResolvedValue({
            id_trajet: 1,
            places_disponibles: 2,
            reservations: [],
            conducteur_id: 2
        });
        prisma.reservation.findFirst.mockResolvedValue(null);
        prisma.reservation.create.mockResolvedValue({ id_reservation: 3 });
        const res = await request(app).post('/reservations').send({ trajet_id: 1 });
        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('accepte la réservation si toutes les réservations sont refusées', async () => {
        prisma.trajet.findUnique.mockResolvedValue({
            id_trajet: 1,
            places_disponibles: 2,
            reservations: [
                { statut: 'refusee' },
                { statut: 'refusee' }
            ],
            conducteur_id: 2
        });
        prisma.reservation.findFirst.mockResolvedValue(null);
        prisma.reservation.create.mockResolvedValue({ id_reservation: 4 });
        const res = await request(app).post('/reservations').send({ trajet_id: 1 });
        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
    });
});

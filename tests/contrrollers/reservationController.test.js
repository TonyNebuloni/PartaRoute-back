const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
jest.mock('../../prisma/prisma');
const prisma = require('../../prisma/prisma');

const reservationController = require('../../controllers/reservationController');

const app = express();
app.use(bodyParser.json());
app.post('/reservations', (req, res, next) => {
    // fake user (bypass auth middleware)
    req.user = { id_utilisateur: 1 };
    next();
}, reservationController.createReservation);

describe('POST /reservations', () => {

    it('devrait créer une réservation', async () => {
        prisma.trajet.findUnique.mockResolvedValue({
            id_trajet: 1,
            places_disponibles: 2,
            reservations: [],
            conducteur_id: 2
        });

        prisma.reservation.findFirst.mockResolvedValue(null);

        prisma.reservation.create.mockResolvedValue({
            id_reservation: 1
        });

        const res = await request(app).post('/reservations').send({
            trajet_id: 1
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
    });

});

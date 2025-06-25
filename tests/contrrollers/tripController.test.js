const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
jest.mock('../../prisma/prisma');
const prisma = require('../../prisma/prisma');

const tripController = require('../../controllers/tripController');

const app = express();
app.use(bodyParser.json());
app.post('/trips', (req, res, next) => {
    // fake user (bypass auth middleware)
    req.user = { id_utilisateur: 1 };
    next();
}, tripController.createTrip);

describe('POST /trips', () => {

    it('devrait créer un trajet', async () => {
        prisma.trajet.create.mockResolvedValue({
            id_trajet: 1,
            ville_depart: 'Nice',
            ville_arrivee: 'Paris'
        });

        const res = await request(app).post('/trips').send({
            ville_depart: 'Nice',
            ville_arrivee: 'Paris',
            date_heure_depart: new Date().toISOString(),
            places_disponibles: 3,
            prix: 50
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
    });

});

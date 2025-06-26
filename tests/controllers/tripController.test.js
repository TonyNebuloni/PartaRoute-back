const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
jest.mock('../../prisma/prisma');
const prisma = require('../../prisma/prisma');

const tripController = require('../../controllers/tripController');

const app = express();
app.use(bodyParser.json());

// Simulation d'utilisateur pour bypass l'auth middleware
app.get('/trips', tripController.getTrips);
app.patch('/trips/:id', (req, res, next) => {
    req.user = { id_utilisateur: 1 };
    next();
}, tripController.updateTrip);
app.delete('/trips/:id', (req, res, next) => {
    req.user = { id_utilisateur: 1 };
    next();
}, tripController.deleteTrip);

describe('GET /trips', () => {
    it('doit retourner une liste de trajets filtrés', async () => {
        prisma.trajet.findMany.mockResolvedValue([
            { id_trajet: 1, ville_depart: 'Nice', ville_arrivee: 'Paris' }
        ]);

        const res = await request(app).get('/trips?ville_depart=Nice');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
    });
});

describe('PATCH /trips/:id', () => {
    it('doit mettre à jour un trajet existant', async () => {
        prisma.trajet.findUnique.mockResolvedValue({
            id_trajet: 1,
            conducteur_id: 1
        });

        prisma.trajet.update.mockResolvedValue({
            id_trajet: 1,
            ville_depart: 'Nice',
            ville_arrivee: 'Lyon'
        });

        const res = await request(app)
            .patch('/trips/1')
            .send({ ville_arrivee: 'Lyon' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.ville_arrivee).toBe('Lyon');
    });
});

describe('DELETE /trips/:id', () => {
    it('doit supprimer un trajet', async () => {
        prisma.trajet.findUnique.mockResolvedValue({
            id_trajet: 1,
            conducteur_id: 1
        });

        prisma.trajet.delete.mockResolvedValue({});

        const res = await request(app).delete('/trips/1');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

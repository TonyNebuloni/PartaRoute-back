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

// Ajout de la route simulée pour le conducteur
app.get('/trips/conducteur/trajets', (req, res, next) => {
    req.user = { id_utilisateur: 42 };
    next();
}, tripController.getTripsForDriver);

beforeEach(() => {
    prisma.reservation.deleteMany = jest.fn().mockResolvedValue({});
});

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
    it('doit supprimer un trajet et notifier les passagers', async () => {
        // Mock du trajet à supprimer
        prisma.trajet.findUnique.mockResolvedValue({
            id_trajet: 1,
            conducteur_id: 1,
            ville_depart: 'Paris',
            ville_arrivee: 'Lyon'
        });
        // Mock des réservations liées
        prisma.reservation.findMany.mockResolvedValue([
            {
                id_reservation: 10,
                passager_id: 2,
                passager: { id_utilisateur: 2, nom: 'Alice' }
            },
            {
                id_reservation: 11,
                passager_id: 3,
                passager: { id_utilisateur: 3, nom: 'Bob' }
            }
        ]);
        // Mock notification.create
        prisma.notification.create.mockResolvedValue({});
        // Mock suppression des réservations
        prisma.reservation.deleteMany.mockResolvedValue({});
        // Mock suppression du trajet
        prisma.trajet.delete.mockResolvedValue({});

        const res = await request(app).delete('/trips/1');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        // Vérifie que la notification a été créée pour chaque passager
        expect(prisma.notification.create).toHaveBeenCalledTimes(2);
        expect(prisma.notification.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                utilisateur_id: 2,
                type: 'annulation',
                contenu_message: expect.stringContaining('a été annulée')
            })
        });
        expect(prisma.notification.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                utilisateur_id: 3,
                type: 'annulation',
                contenu_message: expect.stringContaining('a été annulée')
            })
        });
    });
});

describe('GET /trips/conducteur/trajets', () => {
    it('doit retourner tous les trajets du conducteur avec réservations et passagers', async () => {
        prisma.trajet.findMany.mockResolvedValue([
            {
                id_trajet: 1,
                ville_depart: 'Paris',
                ville_arrivee: 'Lyon',
                conducteur_id: 42,
                reservations: [
                    {
                        id_reservation: 10,
                        statut: 'en_attente',
                        passager: { id_utilisateur: 2, nom: 'Alice' }
                    }
                ]
            },
            {
                id_trajet: 2,
                ville_depart: 'Lyon',
                ville_arrivee: 'Marseille',
                conducteur_id: 42,
                reservations: []
            }
        ]);

        const res = await request(app).get('/trips/conducteur/trajets');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(2);
        expect(res.body.data[0]).toHaveProperty('id_trajet');
        expect(res.body.data[0]).toHaveProperty('reservations');
        expect(Array.isArray(res.body.data[0].reservations)).toBe(true);
        expect(res.body.data[0].reservations[0]).toHaveProperty('passager');
        expect(res.body.data[0].reservations[0].passager.nom).toBe('Alice');
        expect(res.body.data[1].reservations.length).toBe(0);
    });
});

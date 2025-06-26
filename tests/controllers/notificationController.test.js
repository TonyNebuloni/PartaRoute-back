const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
jest.mock('../../prisma/prisma');
const prisma = require('../../prisma/prisma');

const notificationController = require('../../controllers/notificationController');

const app = express();
app.use(bodyParser.json());

app.get('/notifications/:utilisateurId', notificationController.getAllNotifications);
app.post('/notifications', notificationController.createNotification);
app.patch('/notifications/:notificationId/lue', notificationController.markAsRead);
app.delete('/notifications/:notificationId', notificationController.deleteNotification);

describe('GET /notifications/:utilisateurId', () => {
    it('devrait retourner des notifications', async () => {
        prisma.notification.findMany.mockResolvedValue([
            { id_notification: 1, contenu_message: 'Hello', lue: false }
        ]);

        const res = await request(app).get('/notifications/1');
        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBe(1);
    });
});

describe('POST /notifications', () => {
    it('devrait créer une notification', async () => {
        prisma.utilisateur.findUnique.mockResolvedValue({ id_utilisateur: 1 });
        prisma.notification.create.mockResolvedValue({ id_notification: 1 });
        prisma.reservation.findUnique.mockResolvedValue({ id_reservation: 1 });

        const res = await request(app).post('/notifications').send({
            utilisateur_id: 1,
            reservation_id: 1,
            type: 'generique',
            contenu_message: 'Message de test'
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
    });
});

describe('PATCH /notifications/:notificationId/lue', () => {
    it('devrait marquer une notification comme lue', async () => {
        prisma.notification.findUnique.mockResolvedValue({ id_notification: 1 });
        prisma.notification.update.mockResolvedValue({ id_notification: 1, lue: true });

        const res = await request(app).patch('/notifications/1/lue');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

describe('DELETE /notifications/:notificationId', () => {
    it('devrait supprimer une notification', async () => {
        prisma.notification.findUnique.mockResolvedValue({ id_notification: 1 });
        prisma.notification.delete.mockResolvedValue();

        const res = await request(app).delete('/notifications/1');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

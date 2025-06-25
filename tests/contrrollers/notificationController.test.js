const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
jest.mock('../../prisma/prisma');
const prisma = require('../../prisma/prisma');

const notificationController = require('../../controllers/notificationController');

const app = express();
app.use(bodyParser.json());
app.get('/notifications/:utilisateurId', notificationController.getAllNotifications);

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

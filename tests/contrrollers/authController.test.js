const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// On va mocker prisma :
jest.mock('../../prisma/prisma');
const prisma = require('../../prisma/prisma');


// On importe ton controller
const authController = require('../../controllers/authController');

// Préparation de l'API Express temporaire juste pour le test
const app = express();
app.use(bodyParser.json());
app.post('/register', authController.register);

describe('POST /register', () => {

    it('création utilisateur fonctionne', async () => {
        // Simuler qu’il n’y a pas encore d’utilisateur avec cet email
        prisma.utilisateur.findUnique.mockResolvedValue(null);
        prisma.utilisateur.create.mockResolvedValue({
            id_utilisateur: 1,
            email: 'test@example.com',
            nom: 'Thomas',
            role: 'user',
        });

        const res = await request(app)
            .post('/register')
            .send({
                nom: 'Thomas',
                email: 'test@example.com',
                mot_de_passe: 'password123'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe('test@example.com');
    });

});

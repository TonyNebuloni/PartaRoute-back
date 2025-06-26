const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

jest.mock('../../prisma/prisma');
const prisma = require('../../prisma/prisma');

const bcrypt = require('bcryptjs');
jest.mock('bcryptjs');

const jwt = require('jsonwebtoken');
jest.mock('jsonwebtoken');

const authController = require('../../controllers/authController');

const app = express();
app.use(bodyParser.json());
app.post('/register', authController.register);
app.post('/login', authController.login);
app.post('/refresh', authController.refreshToken)

describe('POST /register', () => {
    it('création utilisateur fonctionne', async () => {
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

describe('POST /login', () => {
    it('connexion réussie', async () => {
        prisma.utilisateur.findUnique.mockResolvedValue({
            id_utilisateur: 1,
            email: 'test@example.com',
            mot_de_passe: 'hashedpass',
            role: 'user'
        });

        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue('fakeToken');

        const res = await request(app)
            .post('/login')
            .send({
                email: 'test@example.com',
                mot_de_passe: 'password123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.accessToken).toBe('fakeToken');
    });
});

describe('POST /refresh', () => {
    it('doit renvoyer un nouveau accessToken si refreshToken est valide', async () => {
        const jwt = require('jsonwebtoken');
        jest.spyOn(jwt, 'verify').mockReturnValue({
            id_utilisateur: 1,
            role: 'user'
        });
        jest.spyOn(jwt, 'sign').mockReturnValue('newAccessToken');

        const res = await request(app)
            .post('/refresh')
            .send({ refreshToken: 'validRefreshToken' });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.accessToken).toBe('newAccessToken');
    });
});
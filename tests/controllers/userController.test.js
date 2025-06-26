const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const userController = require('../../controllers/userController');
const authenticateToken = require('../../middlewares/auth');
const adminOnly = require('../../middlewares/adminOnly');
const authorizeSelfOrAdmin = require('../../middlewares/authorizeSelfOrAdmin');

const app = express();
app.use(bodyParser.json());

// Routes protégées montées manuellement
app.get('/api/users/:id', authenticateToken, authorizeSelfOrAdmin, userController.getUserById);
app.get('/api/users', authenticateToken, adminOnly, userController.getAllUsers);

const userPayload = {
    id_utilisateur: 10,
    nom: 'User Test',
    email: 'usertest@example.com',
    role: 'user'
};
const userToken = jwt.sign(userPayload, process.env.JWT_SECRET);

const adminPayload = {
    id_utilisateur: 1,
    nom: 'Admin Test',
    email: 'admin@example.com',
    role: 'admin'
};
const adminToken = jwt.sign(adminPayload, process.env.JWT_SECRET);

beforeAll(async () => {
    await prisma.utilisateur.createMany({
        data: [
            {
                id_utilisateur: userPayload.id_utilisateur,
                nom: userPayload.nom,
                email: userPayload.email,
                mot_de_passe: 'hashedpassword',
                role: userPayload.role,
                photo_profil: 'https://example.com/photo-user.jpg'
            },
            {
                id_utilisateur: adminPayload.id_utilisateur,
                nom: adminPayload.nom,
                email: adminPayload.email,
                mot_de_passe: 'hashedpassword',
                role: adminPayload.role,
                photo_profil: 'https://example.com/photo-admin.jpg'
            }
        ],
        skipDuplicates: true
    });
});

afterAll(async () => {
    await prisma.utilisateur.deleteMany({
        where: {
            id_utilisateur: { in: [userPayload.id_utilisateur, adminPayload.id_utilisateur] }
        }
    });
    await prisma.$disconnect();
});

describe('User Controller - Middleware protected routes', () => {
    it('GET /users/:id - should allow self access', async () => {
        const res = await request(app)
            .get(`/api/users/${userPayload.id_utilisateur}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.email).toBe(userPayload.email);
    });

    it('GET /users/:id - should allow admin access to any user', async () => {
        const res = await request(app)
            .get(`/api/users/${userPayload.id_utilisateur}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
    });

    it('GET /users/:id - should forbid other users', async () => {
        const otherUserToken = jwt.sign({ id_utilisateur: 99, role: 'user' }, process.env.JWT_SECRET);

        const res = await request(app)
            .get(`/api/users/${userPayload.id_utilisateur}`)
            .set('Authorization', `Bearer ${otherUserToken}`);

        expect(res.statusCode).toBe(403);
    });

    it('GET /users - should allow only admin', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /users - should forbid regular user', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toBe(403);
    });
});

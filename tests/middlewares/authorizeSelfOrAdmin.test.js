const request = require('supertest');
const express = require('express');
const authorizeSelfOrAdmin = require('../../middlewares/authorizeSelfOrAdmin');

const app = express();

const injectUser = (user) => (req, res, next) => {
    req.user = user;
    next();
};

app.get('/me/:id', injectUser({ id_utilisateur: 42, role: 'user' }), authorizeSelfOrAdmin, (req, res) => {
    res.status(200).json({ success: true });
});

app.get('/admin/:id', injectUser({ id_utilisateur: 1, role: 'admin' }), authorizeSelfOrAdmin, (req, res) => {
    res.status(200).json({ success: true });
});

app.get('/forbidden/:id', injectUser({ id_utilisateur: 2, role: 'user' }), authorizeSelfOrAdmin, (req, res) => {
    res.status(200).json({ success: true }); // Ne devrait pas passer
});

describe('Middleware: authorizeSelfOrAdmin', () => {
    it('autorise l\'utilisateur lui-même', async () => {
        const res = await request(app).get('/me/42');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('autorise un admin', async () => {
        const res = await request(app).get('/admin/99');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('refuse un autre utilisateur', async () => {
        const res = await request(app).get('/forbidden/99');
        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
    });
});

const request = require('supertest');
const express = require('express');
const adminOnly = require('../../middlewares/adminOnly');

const app = express();

// Middleware pour simuler un utilisateur
const injectUser = (user) => (req, res, next) => {
    req.user = user;
    next();
};

app.get('/admin', injectUser({ role: 'admin' }), adminOnly, (req, res) => {
    res.status(200).json({ success: true });
});
app.get('/admin-denied', injectUser({ role: 'user' }), adminOnly, (req, res) => {
    res.status(200).json({ success: true }); // Ne devrait jamais être atteint
});

describe('Middleware: adminOnly', () => {
    it('autorise les admins', async () => {
        const res = await request(app).get('/admin');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('refuse les non-admins', async () => {
        const res = await request(app).get('/admin-denied');
        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
    });
});

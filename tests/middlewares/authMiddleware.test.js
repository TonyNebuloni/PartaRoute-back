const jwt = require('jsonwebtoken');
const authMiddleware = require('../../middlewares/auth');

jest.mock('jsonwebtoken');

describe('authMiddleware', () => {

    let req, res, next;

    beforeEach(() => {
        req = {
            header: jest.fn()
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    it('doit retourner 401 si aucun token n\'est fourni', () => {
        req.header.mockReturnValue(undefined);

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Token manquant' });
        expect(next).not.toHaveBeenCalled();
    });

    it('doit retourner 403 si le token est invalide', () => {
        req.header.mockReturnValue('Bearer invalidToken');
        jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Token invalide' });
        expect(next).not.toHaveBeenCalled();
    });

    it('doit appeler next() si le token est valide', () => {
        req.header.mockReturnValue('Bearer validToken');
        jwt.verify.mockReturnValue({ id_utilisateur: 1, role: 'user' });

        authMiddleware(req, res, next);

        expect(req.user).toEqual({ id_utilisateur: 1, role: 'user' });
        expect(next).toHaveBeenCalled();
    });

});

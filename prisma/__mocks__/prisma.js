const prismaMock = {
    utilisateur: {
        findUnique: jest.fn(),
        create: jest.fn(),
    },
    notification: {
        findMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    reservation: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    trajet: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
    },
    $transaction: jest.fn(),
    $disconnect: jest.fn(),
};

module.exports = prismaMock;

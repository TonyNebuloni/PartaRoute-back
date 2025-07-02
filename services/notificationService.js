const prisma = require('../prisma/prisma');

exports.createNotification = async ({ utilisateur_id, reservation_id, type, contenu_message }) => {
    return prisma.notification.create({
        data: {
            utilisateur_id,
            reservation_id,
            type,
            contenu_message
        }
    });
}; 
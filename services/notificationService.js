const prisma = require('../prisma/prisma');

exports.createNotification = async ({ utilisateur_id, reservation_id, type, contenu_message, passagerData = null }) => {
    // Si on a des données du passager, on peut enrichir le message
    let messageFinal = contenu_message;
    
    if (passagerData && type === 'demande_reservation') {
        messageFinal = `${passagerData.nom} souhaite réserver une place pour votre trajet.`;
    }
    
    return prisma.notification.create({
        data: {
            utilisateur_id,
            reservation_id,
            type,
            contenu_message: messageFinal
        }
    });
}; 
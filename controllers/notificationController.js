const prisma = require('../prisma/prisma');

// Récupérer toutes les notifications d'un utilisateur
exports.getAllNotifications = async (req, res) => {
    try {
        const utilisateurId = parseInt(req.params.utilisateurId);

        if (!utilisateurId) {
            return res.status(400).json({
                success: false,
                message: "L'identifiant de l'utilisateur doit être fourni."
            });
        }

        const notifications = await prisma.notification.findMany({
            where: {
                utilisateur_id: utilisateurId,
            },
            orderBy: [
                { lue: 'asc' }, // Les non lues (false) en premier
                { date_notification: 'desc' }
            ]
        });

        return res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (err) {
        console.error("Erreur lors de la récupération des notifications:", err);
        res.status(500).json({
            success: false,
            message: "Erreur interne lors de la récupération des notifications."
        });
    }
};

// Créer une nouvelle notification
exports.createNotification = async (req, res) => {
    try {
        const { utilisateur_id, reservation_id, type, contenu_message } = req.body;

        if (!utilisateur_id || !type || !contenu_message) {
            return res.status(400).json({
                success: false,
                message: "Les champs utilisateur_id, type et contenu_message sont requis."
            });
        }

        const utilisateur = await prisma.utilisateur.findUnique({
            where: { id_utilisateur: utilisateur_id }
        });

        if (!utilisateur) {
            return res.status(404).json({
                success: false,
                message: "Utilisateur non trouvé."
            });
        }

        if (reservation_id) {
            const reservation = await prisma.reservation.findUnique({
                where: { id_reservation: reservation_id }
            });
            if (!reservation) {
                return res.status(404).json({
                    success: false,
                    message: "Réservation non trouvée."
                });
            }
        }

        const notification = await prisma.notification.create({
            data: {
                utilisateur_id,
                reservation_id,
                type,
                contenu_message
            }
        });

        return res.status(201).json({
            success: true,
            message: "Notification créée avec succès.",
            data: notification
        });
    } catch (err) {
        console.error("Erreur lors de la création de la notification:", err);
        res.status(500).json({
            success: false,
            message: "Erreur interne lors de la création de la notification."
        });
    }
};

// Marquer une notification comme lue
exports.markAsRead = async (req, res) => {
    try {
        const notificationId = parseInt(req.params.notificationId);

        if (!notificationId) {
            return res.status(400).json({
                success: false,
                message: "L'identifiant de la notification doit être fourni."
            });
        }

        const notification = await prisma.notification.findUnique({
            where: { id_notification: notificationId }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification non trouvée."
            });
        }

        const updatedNotification = await prisma.notification.update({
            where: { id_notification: notificationId },
            data: { lue: true }
        });

        return res.status(200).json({
            success: true,
            message: "Notification marquée comme lue.",
            data: updatedNotification
        });
    } catch (err) {
        console.error("Erreur lors de la mise à jour de la notification:", err);
        res.status(500).json({
            success: false,
            message: "Erreur interne lors de la mise à jour de la notification."
        });
    }
};

// Supprimer une notification
exports.deleteNotification = async (req, res) => {
    try {
        const notificationId = parseInt(req.params.notificationId);

        if (!notificationId) {
            return res.status(400).json({
                success: false,
                message: "L'identifiant de la notification doit être fourni."
            });
        }

        const notification = await prisma.notification.findUnique({
            where: { id_notification: notificationId }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification non trouvée."
            });
        }

        await prisma.notification.delete({
            where: { id_notification: notificationId }
        });

        return res.status(200).json({
            success: true,
            message: "Notification supprimée avec succès."
        });
    } catch (err) {
        console.error("Erreur lors de la suppression de la notification:", err);
        res.status(500).json({
            success: false,
            message: "Erreur interne lors de la suppression de la notification."
        });
    }
};

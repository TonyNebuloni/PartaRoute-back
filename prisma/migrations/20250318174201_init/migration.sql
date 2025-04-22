/*
  Warnings:

  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `user`;

-- CreateTable
CREATE TABLE `Utilisateur` (
    `id_utilisateur` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `mot_de_passe` VARCHAR(191) NOT NULL,
    `photo_profil` VARCHAR(191) NOT NULL,
    `preferences` JSON NULL,
    `role` ENUM('user', 'admin') NOT NULL,
    `date_inscription` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Utilisateur_email_key`(`email`),
    PRIMARY KEY (`id_utilisateur`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Trajet` (
    `id_trajet` INTEGER NOT NULL AUTO_INCREMENT,
    `conducteur_id` INTEGER NOT NULL,
    `ville_depart` VARCHAR(191) NOT NULL,
    `ville_arrivee` VARCHAR(191) NOT NULL,
    `date_heure_depart` DATETIME(3) NOT NULL,
    `places_disponibles` INTEGER NOT NULL,
    `prix` DECIMAL(65, 30) NOT NULL,
    `conditions` JSON NULL,
    `date_creation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_trajet`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reservation` (
    `id_reservation` INTEGER NOT NULL AUTO_INCREMENT,
    `trajet_id` INTEGER NOT NULL,
    `passager_id` INTEGER NOT NULL,
    `date_reservation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `statut` ENUM('en_attente', 'acceptee', 'refusee', 'annulee') NOT NULL,

    PRIMARY KEY (`id_reservation`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id_notification` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateur_id` INTEGER NOT NULL,
    `reservation_id` INTEGER NULL,
    `type` ENUM('demande_reservation', 'confirmation', 'refus', 'annulation', 'generique') NOT NULL,
    `contenu_message` VARCHAR(191) NOT NULL,
    `date_notification` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lue` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id_notification`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Administrateur` (
    `id_admin` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateur_id` INTEGER NOT NULL,
    `niveau_acces` VARCHAR(191) NULL,

    UNIQUE INDEX `Administrateur_utilisateur_id_key`(`utilisateur_id`),
    PRIMARY KEY (`id_admin`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Trajet` ADD CONSTRAINT `Trajet_conducteur_id_fkey` FOREIGN KEY (`conducteur_id`) REFERENCES `Utilisateur`(`id_utilisateur`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_trajet_id_fkey` FOREIGN KEY (`trajet_id`) REFERENCES `Trajet`(`id_trajet`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_passager_id_fkey` FOREIGN KEY (`passager_id`) REFERENCES `Utilisateur`(`id_utilisateur`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_utilisateur_id_fkey` FOREIGN KEY (`utilisateur_id`) REFERENCES `Utilisateur`(`id_utilisateur`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_reservation_id_fkey` FOREIGN KEY (`reservation_id`) REFERENCES `Reservation`(`id_reservation`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Administrateur` ADD CONSTRAINT `Administrateur_utilisateur_id_fkey` FOREIGN KEY (`utilisateur_id`) REFERENCES `Utilisateur`(`id_utilisateur`) ON DELETE RESTRICT ON UPDATE CASCADE;

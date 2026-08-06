-- CreateTable
CREATE TABLE `GeneralSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `siteTitle` VARCHAR(191) NOT NULL DEFAULT 'HRM Plus',
    `logoUrl` VARCHAR(191) NULL,
    `logoKey` VARCHAR(191) NULL,
    `faviconUrl` VARCHAR(191) NULL,
    `faviconKey` VARCHAR(191) NULL,
    `dateFormat` VARCHAR(191) NOT NULL DEFAULT 'DD/MM/YYYY',
    `timeFormat` VARCHAR(191) NOT NULL DEFAULT '24h',
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'UTC',
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `language` VARCHAR(191) NOT NULL DEFAULT 'en',
    `copyrightText` VARCHAR(191) NULL,
    `updatedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GeneralSettings` ADD CONSTRAINT `GeneralSettings_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


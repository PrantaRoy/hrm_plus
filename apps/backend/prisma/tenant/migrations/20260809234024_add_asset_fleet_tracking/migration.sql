-- CreateTable
CREATE TABLE `Asset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `assetTag` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Available',
    `serialNumber` VARCHAR(191) NULL,
    `purchaseDate` DATETIME(3) NULL,
    `purchaseCost` DECIMAL(12, 2) NULL,
    `supplier` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `registrationNumber` VARCHAR(191) NULL,
    `registrationExpiry` DATETIME(3) NULL,
    `wofCofExpiry` DATETIME(3) NULL,
    `make` VARCHAR(191) NULL,
    `model` VARCHAR(191) NULL,
    `vin` VARCHAR(191) NULL,
    `testAndTagExpiry` DATETIME(3) NULL,
    `warrantyExpiry` DATETIME(3) NULL,
    `isFbtRelevant` BOOLEAN NOT NULL DEFAULT false,
    `fbtNotes` TEXT NULL,
    `currentAssignmentId` INTEGER NULL,
    `photoUrl` VARCHAR(191) NULL,
    `photoKey` VARCHAR(191) NULL,
    `createdById` INTEGER NOT NULL,
    `updatedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Asset_assetTag_key`(`assetTag`),
    UNIQUE INDEX `Asset_currentAssignmentId_key`(`currentAssignmentId`),
    INDEX `Asset_category_idx`(`category`),
    INDEX `Asset_status_idx`(`status`),
    INDEX `Asset_isFbtRelevant_idx`(`isFbtRelevant`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssetAssignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `assetId` INTEGER NOT NULL,
    `employeeId` INTEGER NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assignedById` INTEGER NOT NULL,
    `expectedReturnDate` DATETIME(3) NULL,
    `returnedAt` DATETIME(3) NULL,
    `returnedToId` INTEGER NULL,
    `conditionOnAssign` VARCHAR(191) NULL,
    `conditionOnReturn` VARCHAR(191) NULL,
    `assignReceiptRequestId` INTEGER NULL,
    `returnReceiptRequestId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AssetAssignment_assignReceiptRequestId_key`(`assignReceiptRequestId`),
    UNIQUE INDEX `AssetAssignment_returnReceiptRequestId_key`(`returnReceiptRequestId`),
    INDEX `AssetAssignment_assetId_idx`(`assetId`),
    INDEX `AssetAssignment_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssetReminderLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `assetId` INTEGER NOT NULL,
    `expiryField` VARCHAR(191) NOT NULL,
    `windowDays` INTEGER NOT NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AssetReminderLog_assetId_idx`(`assetId`),
    UNIQUE INDEX `AssetReminderLog_assetId_expiryField_windowDays_key`(`assetId`, `expiryField`, `windowDays`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Asset` ADD CONSTRAINT `Asset_currentAssignmentId_fkey` FOREIGN KEY (`currentAssignmentId`) REFERENCES `AssetAssignment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Asset` ADD CONSTRAINT `Asset_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Asset` ADD CONSTRAINT `Asset_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssetAssignment` ADD CONSTRAINT `AssetAssignment_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssetAssignment` ADD CONSTRAINT `AssetAssignment_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssetAssignment` ADD CONSTRAINT `AssetAssignment_assignedById_fkey` FOREIGN KEY (`assignedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssetAssignment` ADD CONSTRAINT `AssetAssignment_returnedToId_fkey` FOREIGN KEY (`returnedToId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssetAssignment` ADD CONSTRAINT `AssetAssignment_assignReceiptRequestId_fkey` FOREIGN KEY (`assignReceiptRequestId`) REFERENCES `DocumentRequest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssetAssignment` ADD CONSTRAINT `AssetAssignment_returnReceiptRequestId_fkey` FOREIGN KEY (`returnReceiptRequestId`) REFERENCES `DocumentRequest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssetReminderLog` ADD CONSTRAINT `AssetReminderLog_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- SeedData: Asset Receipt / Return document categories (idempotent — safe to re-run against already-provisioned tenants)
INSERT INTO `DocumentCategory` (`code`, `name`, `status`, `createdAt`, `updatedAt`) VALUES
    ('ASSET_RECEIPT', 'Asset Receipt Acknowledgement', 'Active', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('ASSET_RETURN', 'Asset Return Checklist', 'Active', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- AlterTable
ALTER TABLE `Task` ADD COLUMN `completedAt` DATETIME(3) NULL;

-- Backfill: existing completed tasks have no completion timestamp, fall back to last update
UPDATE `Task` SET `completedAt` = `updatedAt` WHERE `status` = 'completed';

-- CreateTable
CREATE TABLE `AiKpiReport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `scopeType` VARCHAR(191) NOT NULL,
    `scopeId` INTEGER NOT NULL,
    `scopeLabel` VARCHAR(191) NOT NULL,
    `periodType` VARCHAR(191) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `employeeCount` INTEGER NOT NULL,
    `metrics` JSON NOT NULL,
    `impression` JSON NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `generatedById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiKpiReport_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AiKpiReport` ADD CONSTRAINT `AiKpiReport_generatedById_fkey` FOREIGN KEY (`generatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

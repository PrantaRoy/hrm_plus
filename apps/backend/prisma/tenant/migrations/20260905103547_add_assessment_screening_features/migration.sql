-- AlterTable
ALTER TABLE `Assessment` ADD COLUMN `timeLimitMinutes` INTEGER NULL;

-- AlterTable
ALTER TABLE `AssessmentInvitation` ADD COLUMN `currentQuestionIndex` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `examExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `participationDeadlineAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Job` ADD COLUMN `assessmentDeadlineDays` INTEGER NULL;

-- CreateTable
CREATE TABLE `AiSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `provider` VARCHAR(191) NOT NULL DEFAULT 'GROQ',
    `model` VARCHAR(191) NULL,
    `apiKeyCiphertext` TEXT NULL,
    `updatedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AiSettings` ADD CONSTRAINT `AiSettings_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


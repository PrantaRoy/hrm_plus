-- AlterTable
ALTER TABLE `AttendanceSettings` ADD COLUMN `qrCodeEnabled` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `AttendanceQrSession` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NULL,
    `createdById` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttendanceQrToken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` INTEGER NOT NULL,
    `jti` VARCHAR(191) NOT NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `usedByEmployeeId` INTEGER NULL,
    `usedForMethod` VARCHAR(191) NULL,

    UNIQUE INDEX `AttendanceQrToken_jti_key`(`jti`),
    INDEX `AttendanceQrToken_sessionId_expiresAt_idx`(`sessionId`, `expiresAt`),
    INDEX `AttendanceQrToken_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AttendanceQrSession` ADD CONSTRAINT `AttendanceQrSession_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceQrToken` ADD CONSTRAINT `AttendanceQrToken_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `AttendanceQrSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceQrToken` ADD CONSTRAINT `AttendanceQrToken_usedByEmployeeId_fkey` FOREIGN KEY (`usedByEmployeeId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

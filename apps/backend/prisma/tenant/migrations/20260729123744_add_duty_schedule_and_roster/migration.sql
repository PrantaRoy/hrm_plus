-- AlterTable
ALTER TABLE `Department` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `Role` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- CreateTable
CREATE TABLE `DutySchedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `checkinConsiderMinutes` INTEGER NOT NULL DEFAULT 0,
    `checkoutConsiderMinutes` INTEGER NOT NULL DEFAULT 0,
    `maxOverTimeMinutes` INTEGER NOT NULL DEFAULT 0,
    `earlyCheckinBufferMinutes` INTEGER NOT NULL DEFAULT 0,
    `isTardyApplicable` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `shortDescription` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Roster` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `departmentId` INTEGER NOT NULL,
    `periodType` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Draft',
    `generatedById` INTEGER NULL,
    `approvedById` INTEGER NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdById` INTEGER NOT NULL,
    `updatedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Roster_departmentId_startDate_endDate_idx`(`departmentId`, `startDate`, `endDate`),
    INDEX `Roster_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DutyScheduleAssignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rosterId` INTEGER NOT NULL,
    `employeeId` INTEGER NOT NULL,
    `dutyScheduleId` INTEGER NULL,
    `departmentId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Scheduled',
    `comment` VARCHAR(191) NULL,
    `isLeave` BOOLEAN NOT NULL DEFAULT false,
    `isHoliday` BOOLEAN NOT NULL DEFAULT false,
    `isWeekend` BOOLEAN NOT NULL DEFAULT false,
    `changeRequest` VARCHAR(191) NULL,
    `createdById` INTEGER NOT NULL,
    `updatedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DutyScheduleAssignment_rosterId_idx`(`rosterId`),
    INDEX `DutyScheduleAssignment_departmentId_date_idx`(`departmentId`, `date`),
    INDEX `DutyScheduleAssignment_dutyScheduleId_idx`(`dutyScheduleId`),
    UNIQUE INDEX `DutyScheduleAssignment_employeeId_date_key`(`employeeId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Roster` ADD CONSTRAINT `Roster_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Roster` ADD CONSTRAINT `Roster_generatedById_fkey` FOREIGN KEY (`generatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Roster` ADD CONSTRAINT `Roster_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Roster` ADD CONSTRAINT `Roster_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Roster` ADD CONSTRAINT `Roster_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DutyScheduleAssignment` ADD CONSTRAINT `DutyScheduleAssignment_rosterId_fkey` FOREIGN KEY (`rosterId`) REFERENCES `Roster`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DutyScheduleAssignment` ADD CONSTRAINT `DutyScheduleAssignment_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DutyScheduleAssignment` ADD CONSTRAINT `DutyScheduleAssignment_dutyScheduleId_fkey` FOREIGN KEY (`dutyScheduleId`) REFERENCES `DutySchedule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DutyScheduleAssignment` ADD CONSTRAINT `DutyScheduleAssignment_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DutyScheduleAssignment` ADD CONSTRAINT `DutyScheduleAssignment_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DutyScheduleAssignment` ADD CONSTRAINT `DutyScheduleAssignment_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


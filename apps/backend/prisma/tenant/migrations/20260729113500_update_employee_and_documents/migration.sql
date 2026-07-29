-- DropForeignKey
ALTER TABLE `Employee` DROP FOREIGN KEY `Employee_managerId_fkey`;

-- AlterTable (rename startDate->joiningDate and managerId->reportingToId in place to preserve data)
ALTER TABLE `Employee`
    CHANGE COLUMN `managerId` `reportingToId` INTEGER NULL,
    CHANGE COLUMN `startDate` `joiningDate` DATETIME(3) NOT NULL,
    ADD COLUMN `avatarKey` VARCHAR(191) NULL,
    ADD COLUMN `avatarUrl` VARCHAR(191) NULL,
    ADD COLUMN `dateOfBirth` DATETIME(3) NULL,
    ADD COLUMN `designationId` INTEGER NULL,
    ADD COLUMN `employmentType` VARCHAR(191) NOT NULL DEFAULT 'Full-Time',
    ADD COLUMN `gender` VARCHAR(191) NULL,
    ADD COLUMN `phoneNumber` VARCHAR(191) NULL,
    ADD COLUMN `terminationDate` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `EmployeeDocument` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employeeId` INTEGER NOT NULL,
    `documentName` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NULL,
    `expiryDate` DATETIME(3) NULL,
    `documentFileUrl` VARCHAR(191) NULL,
    `documentFileKey` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- RenameIndex (the index created for managerId now covers the renamed reportingToId column)
ALTER TABLE `Employee` RENAME INDEX `Employee_managerId_fkey` TO `Employee_reportingToId_fkey`;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_designationId_fkey` FOREIGN KEY (`designationId`) REFERENCES `Designation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_reportingToId_fkey` FOREIGN KEY (`reportingToId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeDocument` ADD CONSTRAINT `EmployeeDocument_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

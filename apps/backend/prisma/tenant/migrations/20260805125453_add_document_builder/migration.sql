-- AlterTable
ALTER TABLE `User` ADD COLUMN `signatureImageKey` VARCHAR(191) NULL,
    ADD COLUMN `signatureImageUrl` VARCHAR(191) NULL,
    ADD COLUMN `signatureUpdatedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `DocumentCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DocumentCategory_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shortCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `categoryId` INTEGER NOT NULL,
    `bodyHtml` TEXT NOT NULL,
    `isStaffRequestable` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `createdById` INTEGER NOT NULL,
    `updatedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DocumentTemplate_shortCode_key`(`shortCode`),
    INDEX `DocumentTemplate_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentTemplateApprovalStep` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `templateId` INTEGER NOT NULL,
    `stepOrder` INTEGER NOT NULL,
    `approverType` VARCHAR(191) NOT NULL,
    `roleId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DocumentTemplateApprovalStep_templateId_idx`(`templateId`),
    UNIQUE INDEX `DocumentTemplateApprovalStep_templateId_stepOrder_key`(`templateId`, `stepOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employeeId` INTEGER NOT NULL,
    `templateId` INTEGER NOT NULL,
    `reason` VARCHAR(191) NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'Medium',
    `deadlineDate` DATETIME(3) NULL,
    `attachmentFileUrl` VARCHAR(191) NULL,
    `attachmentFileKey` VARCHAR(191) NULL,
    `fieldValues` JSON NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `currentStepOrder` INTEGER NOT NULL DEFAULT 1,
    `referenceNumber` VARCHAR(191) NULL,
    `finalFileUrl` VARCHAR(191) NULL,
    `finalFileKey` VARCHAR(191) NULL,
    `issuedAt` DATETIME(3) NULL,
    `createdById` INTEGER NOT NULL,
    `updatedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DocumentRequest_referenceNumber_key`(`referenceNumber`),
    INDEX `DocumentRequest_employeeId_idx`(`employeeId`),
    INDEX `DocumentRequest_templateId_idx`(`templateId`),
    INDEX `DocumentRequest_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentRequestApproval` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `documentRequestId` INTEGER NOT NULL,
    `stepOrder` INTEGER NOT NULL,
    `approverType` VARCHAR(191) NOT NULL,
    `roleId` INTEGER NULL,
    `roleName` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `decidedByUserId` INTEGER NULL,
    `decidedAt` DATETIME(3) NULL,
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DocumentRequestApproval_documentRequestId_idx`(`documentRequestId`),
    UNIQUE INDEX `DocumentRequestApproval_documentRequestId_stepOrder_key`(`documentRequestId`, `stepOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DocumentTemplate` ADD CONSTRAINT `DocumentTemplate_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `DocumentCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentTemplate` ADD CONSTRAINT `DocumentTemplate_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentTemplate` ADD CONSTRAINT `DocumentTemplate_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentTemplateApprovalStep` ADD CONSTRAINT `DocumentTemplateApprovalStep_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `DocumentTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentTemplateApprovalStep` ADD CONSTRAINT `DocumentTemplateApprovalStep_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentRequest` ADD CONSTRAINT `DocumentRequest_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentRequest` ADD CONSTRAINT `DocumentRequest_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `DocumentTemplate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentRequest` ADD CONSTRAINT `DocumentRequest_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentRequest` ADD CONSTRAINT `DocumentRequest_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentRequestApproval` ADD CONSTRAINT `DocumentRequestApproval_documentRequestId_fkey` FOREIGN KEY (`documentRequestId`) REFERENCES `DocumentRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentRequestApproval` ADD CONSTRAINT `DocumentRequestApproval_decidedByUserId_fkey` FOREIGN KEY (`decidedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- SeedData: default document categories (idempotent — safe to re-run against already-provisioned tenants)
INSERT INTO `DocumentCategory` (`code`, `name`, `status`, `createdAt`, `updatedAt`) VALUES
    ('SALARY_CERT', 'Salary Certificate', 'Active', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('PAYSLIP', 'Payslip', 'Active', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('EXP_LETTER', 'Experience Letter', 'Active', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('APPOINT_LETTER', 'Appointment Letter', 'Active', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('LEAVE_APPROVAL', 'Leave Approval Letter', 'Active', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('APPRECIATION_LETTER', 'Appreciation Letter', 'Active', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('SALARY_INCREMENT', 'Salary Increment Letter', 'Active', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('AWARD_LETTER', 'Award Letter', 'Active', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

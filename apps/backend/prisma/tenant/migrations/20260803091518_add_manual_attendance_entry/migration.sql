-- AlterTable
ALTER TABLE `Attendance` ADD COLUMN `isManualEntry` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `manualEntryById` INTEGER NULL,
    ADD COLUMN `manualEntryNote` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_manualEntryById_fkey` FOREIGN KEY (`manualEntryById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

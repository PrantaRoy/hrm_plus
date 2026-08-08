-- AlterTable
ALTER TABLE `AssessmentAnswer` ADD COLUMN `selectedOptionIndexes` JSON NULL;

-- AlterTable
ALTER TABLE `AssessmentQuestion` ADD COLUMN `correctOptionIndexes` JSON NULL;


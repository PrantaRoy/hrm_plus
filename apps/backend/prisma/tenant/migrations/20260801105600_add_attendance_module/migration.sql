-- CreateTable
CREATE TABLE `AttendanceSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pressAndHoldEnabled` BOOLEAN NOT NULL DEFAULT true,
    `updatedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeAttendanceMethod` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employeeId` INTEGER NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EmployeeAttendanceMethod_employeeId_idx`(`employeeId`),
    UNIQUE INDEX `EmployeeAttendanceMethod_employeeId_method_key`(`employeeId`, `method`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employeeId` INTEGER NOT NULL,
    `dutyScheduleAssignmentId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `checkInAt` DATETIME(3) NULL,
    `checkInMethod` VARCHAR(191) NULL,
    `isLate` BOOLEAN NOT NULL DEFAULT false,
    `lateReason` VARCHAR(191) NULL,
    `checkOutAt` DATETIME(3) NULL,
    `checkOutMethod` VARCHAR(191) NULL,
    `isEarlyCheckout` BOOLEAN NOT NULL DEFAULT false,
    `earlyCheckoutReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Attendance_dutyScheduleAssignmentId_key`(`dutyScheduleAssignmentId`),
    INDEX `Attendance_employeeId_date_idx`(`employeeId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BreakLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `attendanceId` INTEGER NOT NULL,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BreakLog_attendanceId_idx`(`attendanceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AttendanceSettings` ADD CONSTRAINT `AttendanceSettings_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeAttendanceMethod` ADD CONSTRAINT `EmployeeAttendanceMethod_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_dutyScheduleAssignmentId_fkey` FOREIGN KEY (`dutyScheduleAssignmentId`) REFERENCES `DutyScheduleAssignment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BreakLog` ADD CONSTRAINT `BreakLog_attendanceId_fkey` FOREIGN KEY (`attendanceId`) REFERENCES `Attendance`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `Package` ADD COLUMN `billingPeriod` VARCHAR(191) NULL,
    ADD COLUMN `ctaLabel` VARCHAR(191) NULL,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `features` JSON NULL,
    ADD COLUMN `isPopular` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `SaasSiteSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `siteName` VARCHAR(191) NOT NULL DEFAULT 'HRM PLUS',
    `logoUrl` VARCHAR(191) NULL,
    `logoKey` VARCHAR(191) NULL,
    `faviconUrl` VARCHAR(191) NULL,
    `faviconKey` VARCHAR(191) NULL,
    `navLinks` JSON NULL,
    `headerCtaLabel` VARCHAR(191) NOT NULL DEFAULT 'Get started',
    `headerCtaHref` VARCHAR(191) NOT NULL DEFAULT '#pricing',
    `loginUrl` VARCHAR(191) NOT NULL DEFAULT '/admin/login',
    `heroEyebrow` VARCHAR(191) NULL,
    `heroHeadline` VARCHAR(191) NOT NULL DEFAULT 'Run your whole workforce from one clean dashboard.',
    `heroSubheadline` TEXT NULL,
    `heroPrimaryCtaLabel` VARCHAR(191) NULL DEFAULT 'Get started',
    `heroPrimaryCtaHref` VARCHAR(191) NULL DEFAULT '#pricing',
    `heroSecondaryCtaLabel` VARCHAR(191) NULL DEFAULT 'See how it works',
    `heroSecondaryCtaHref` VARCHAR(191) NULL DEFAULT '#process',
    `heroImageUrl` VARCHAR(191) NULL,
    `heroImageKey` VARCHAR(191) NULL,
    `sections` JSON NULL,
    `ctaHeading` VARCHAR(191) NULL,
    `ctaSubheading` TEXT NULL,
    `ctaButtonLabel` VARCHAR(191) NULL,
    `ctaButtonHref` VARCHAR(191) NULL,
    `contactHeading` VARCHAR(191) NULL,
    `contactSubheading` TEXT NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `contactAddress` TEXT NULL,
    `footerTagline` TEXT NULL,
    `footerColumns` JSON NULL,
    `socialLinks` JSON NULL,
    `footerLegalText` VARCHAR(191) NULL,
    `metaTitle` VARCHAR(191) NULL,
    `metaDescription` TEXT NULL,
    `ogImageUrl` VARCHAR(191) NULL,
    `ogImageKey` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SaasLandingBlock` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `blockType` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subtitle` TEXT NULL,
    `body` TEXT NULL,
    `icon` VARCHAR(191) NULL,
    `mediaUrl` VARCHAR(191) NULL,
    `mediaKey` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SaasLandingBlock_blockType_sortOrder_idx`(`blockType`, `sortOrder`),
    INDEX `SaasLandingBlock_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SaasBlogPost` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NULL,
    `contentMarkdown` TEXT NOT NULL,
    `coverImageUrl` VARCHAR(191) NULL,
    `coverImageKey` VARCHAR(191) NULL,
    `authorName` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `metaDescription` TEXT NULL,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SaasBlogPost_slug_key`(`slug`),
    INDEX `SaasBlogPost_status_idx`(`status`),
    INDEX `SaasBlogPost_publishedAt_idx`(`publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SaasContactSubmission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NULL,
    `message` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'UNREAD',
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SaasContactSubmission_status_idx`(`status`),
    INDEX `SaasContactSubmission_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


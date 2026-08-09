-- AlterTable
ALTER TABLE `Job` ADD COLUMN `location` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `SiteSetting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `siteTitle` VARCHAR(191) NOT NULL DEFAULT 'Our Company',
    `tagline` VARCHAR(191) NULL,
    `logoUrl` VARCHAR(191) NULL,
    `logoKey` VARCHAR(191) NULL,
    `faviconUrl` VARCHAR(191) NULL,
    `faviconKey` VARCHAR(191) NULL,
    `primaryColor` VARCHAR(191) NOT NULL DEFAULT '#4F46E5',
    `secondaryColor` VARCHAR(191) NOT NULL DEFAULT '#0EA5E9',
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `contactAddress` TEXT NULL,
    `businessHours` JSON NULL,
    `aboutHeading` VARCHAR(191) NULL,
    `aboutContent` TEXT NULL,
    `metaDescription` TEXT NULL,
    `updatedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteSection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sectionKey` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SiteSection_sectionKey_key`(`sectionKey`),
    INDEX `SiteSection_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HeroSlide` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `headline` VARCHAR(191) NOT NULL,
    `subHeadline` VARCHAR(191) NULL,
    `mediaType` VARCHAR(191) NOT NULL DEFAULT 'IMAGE',
    `mediaUrl` VARCHAR(191) NOT NULL,
    `mediaKey` VARCHAR(191) NULL,
    `ctaPrimaryText` VARCHAR(191) NULL,
    `ctaPrimaryUrl` VARCHAR(191) NULL,
    `ctaSecondaryText` VARCHAR(191) NULL,
    `ctaSecondaryUrl` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HeroSlide_isActive_idx`(`isActive`),
    INDEX `HeroSlide_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompanyService` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `icon` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CompanyService_isActive_idx`(`isActive`),
    INDEX `CompanyService_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GalleryItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NULL,
    `caption` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `imageKey` VARCHAR(191) NULL,
    `thumbnailUrl` VARCHAR(191) NULL,
    `thumbnailKey` VARCHAR(191) NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GalleryItem_category_idx`(`category`),
    INDEX `GalleryItem_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlogPost` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `featuredImageUrl` VARCHAR(191) NULL,
    `featuredImageKey` VARCHAR(191) NULL,
    `excerpt` TEXT NULL,
    `content` TEXT NOT NULL,
    `authorName` VARCHAR(191) NULL,
    `authorAvatarUrl` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `createdById` INTEGER NOT NULL,
    `updatedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BlogPost_slug_key`(`slug`),
    INDEX `BlogPost_status_idx`(`status`),
    INDEX `BlogPost_publishedAt_idx`(`publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactInquiry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NULL,
    `message` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'UNREAD',
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ContactInquiry_status_idx`(`status`),
    INDEX `ContactInquiry_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SocialLink` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `platform` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SocialLink_isActive_idx`(`isActive`),
    INDEX `SocialLink_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LegalPage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `updatedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LegalPage_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SiteSetting` ADD CONSTRAINT `SiteSetting_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlogPost` ADD CONSTRAINT `BlogPost_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlogPost` ADD CONSTRAINT `BlogPost_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LegalPage` ADD CONSTRAINT `LegalPage_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


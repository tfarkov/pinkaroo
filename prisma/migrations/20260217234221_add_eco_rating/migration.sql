-- AlterTable
ALTER TABLE `Listing` ADD COLUMN `appliancesAgeYears` INTEGER NULL,
    ADD COLUMN `ecoRatingScore` DOUBLE NULL,
    ADD COLUMN `hasRecentRenovations` BOOLEAN NULL,
    ADD COLUMN `heatingType` VARCHAR(191) NULL,
    ADD COLUMN `insulationQuality` VARCHAR(191) NULL,
    ADD COLUMN `roofAgeYears` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Listing_ecoRatingScore_idx` ON `Listing`(`ecoRatingScore`);

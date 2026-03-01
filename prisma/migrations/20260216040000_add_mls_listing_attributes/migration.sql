-- AlterTable
ALTER TABLE `Listing` ADD COLUMN `streetAddress` VARCHAR(191) NULL,
    ADD COLUMN `unitNumber` VARCHAR(191) NULL,
    ADD COLUMN `yearBuilt` INTEGER NULL,
    ADD COLUMN `lotSizeSqm` DOUBLE NULL,
    ADD COLUMN `standardStatus` VARCHAR(191) NULL,
    ADD COLUMN `halfBathroomsTotal` INTEGER NULL,
    ADD COLUMN `buildingLevelTotal` INTEGER NULL,
    ADD COLUMN `mlsLastUpdated` DATETIME(3) NULL,
    ADD COLUMN `mlsData` JSON NULL;

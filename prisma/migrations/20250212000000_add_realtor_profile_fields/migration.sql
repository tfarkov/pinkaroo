-- AlterTable
ALTER TABLE `User` ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `availableHours` VARCHAR(191) NULL,
    ADD COLUMN `isTeamLead` BOOLEAN NULL DEFAULT false;

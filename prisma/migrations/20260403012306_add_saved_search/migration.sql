-- AlterTable
ALTER TABLE `BrokerBroadcast` MODIFY `message` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `CommsTemplate` MODIFY `body` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `WorkloadAssignment` MODIFY `details` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `SavedSearch` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `filters` JSON NOT NULL,
    `notifyNewMatch` BOOLEAN NOT NULL DEFAULT false,
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastNotifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SavedSearch_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SavedSearch` ADD CONSTRAINT `SavedSearch_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

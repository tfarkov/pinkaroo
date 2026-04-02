-- Broker management expansion: performance targets, workload ops, client oversight, comms, audit logs

-- Team KPI targets
ALTER TABLE `Team`
  ADD COLUMN `targetListings` INTEGER NULL DEFAULT 0,
  ADD COLUMN `targetRevenue` DOUBLE NULL DEFAULT 0,
  ADD COLUMN `targetInteractions` INTEGER NULL DEFAULT 0;

-- Client oversight scope to broker/team
ALTER TABLE `Client`
  ADD COLUMN `brokerId` VARCHAR(191) NULL,
  ADD COLUMN `teamId` VARCHAR(191) NULL;

CREATE INDEX `Client_brokerId_idx` ON `Client`(`brokerId`);
CREATE INDEX `Client_teamId_idx` ON `Client`(`teamId`);

ALTER TABLE `Client`
  ADD CONSTRAINT `Client_brokerId_fkey`
  FOREIGN KEY (`brokerId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Client_teamId_fkey`
  FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Workload assignments
CREATE TABLE `WorkloadAssignment` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `details` TEXT NULL,
  `priority` INTEGER NOT NULL DEFAULT 3,
  `status` ENUM('OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE') NOT NULL DEFAULT 'OPEN',
  `dueAt` DATETIME(3) NULL,
  `brokerId` VARCHAR(191) NOT NULL,
  `realtorId` VARCHAR(191) NOT NULL,
  `assignedById` VARCHAR(191) NULL,
  `clientId` VARCHAR(191) NULL,
  `listingId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `WorkloadAssignment_brokerId_status_idx`(`brokerId`, `status`),
  INDEX `WorkloadAssignment_realtorId_status_idx`(`realtorId`, `status`),
  INDEX `WorkloadAssignment_dueAt_idx`(`dueAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `WorkloadAssignment`
  ADD CONSTRAINT `WorkloadAssignment_brokerId_fkey`
  FOREIGN KEY (`brokerId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `WorkloadAssignment_realtorId_fkey`
  FOREIGN KEY (`realtorId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `WorkloadAssignment_assignedById_fkey`
  FOREIGN KEY (`assignedById`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `WorkloadAssignment_clientId_fkey`
  FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `WorkloadAssignment_listingId_fkey`
  FOREIGN KEY (`listingId`) REFERENCES `Listing`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Broker communications
CREATE TABLE `CommsTemplate` (
  `id` VARCHAR(191) NOT NULL,
  `brokerId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `CommsTemplate_brokerId_idx`(`brokerId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CommsTemplate`
  ADD CONSTRAINT `CommsTemplate_brokerId_fkey`
  FOREIGN KEY (`brokerId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `BrokerBroadcast` (
  `id` VARCHAR(191) NOT NULL,
  `brokerId` VARCHAR(191) NOT NULL,
  `teamId` VARCHAR(191) NULL,
  `templateId` VARCHAR(191) NULL,
  `sentById` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `BrokerBroadcast_brokerId_createdAt_idx`(`brokerId`, `createdAt`),
  INDEX `BrokerBroadcast_teamId_idx`(`teamId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `BrokerBroadcast`
  ADD CONSTRAINT `BrokerBroadcast_brokerId_fkey`
  FOREIGN KEY (`brokerId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `BrokerBroadcast_teamId_fkey`
  FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `BrokerBroadcast_templateId_fkey`
  FOREIGN KEY (`templateId`) REFERENCES `CommsTemplate`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `BrokerBroadcast_sentById_fkey`
  FOREIGN KEY (`sentById`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Audit trail
CREATE TABLE `AuditLog` (
  `id` VARCHAR(191) NOT NULL,
  `actorId` VARCHAR(191) NOT NULL,
  `brokerId` VARCHAR(191) NULL,
  `action` VARCHAR(191) NOT NULL,
  `entityType` VARCHAR(191) NOT NULL,
  `entityId` VARCHAR(191) NULL,
  `details` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `AuditLog_brokerId_createdAt_idx`(`brokerId`, `createdAt`),
  INDEX `AuditLog_actorId_createdAt_idx`(`actorId`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AuditLog`
  ADD CONSTRAINT `AuditLog_actorId_fkey`
  FOREIGN KEY (`actorId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `AuditLog_brokerId_fkey`
  FOREIGN KEY (`brokerId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

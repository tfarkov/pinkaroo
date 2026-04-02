-- Admin role expansion:
-- 1) add OFFICE_ADMIN and SYSTEM_ADMIN while retaining ADMIN temporarily
-- 2) migrate existing ADMIN users to SYSTEM_ADMIN
-- 3) remove ADMIN from enum

ALTER TABLE `User`
  MODIFY COLUMN `role` ENUM('USER', 'ADMIN', 'OFFICE_ADMIN', 'SYSTEM_ADMIN', 'REALTOR', 'BROKER') NOT NULL DEFAULT 'USER';

UPDATE `User`
SET `role` = 'SYSTEM_ADMIN'
WHERE `role` = 'ADMIN';

ALTER TABLE `User`
  MODIFY COLUMN `role` ENUM('USER', 'OFFICE_ADMIN', 'SYSTEM_ADMIN', 'REALTOR', 'BROKER') NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE INDEX `Interaction_userId_idx` ON `Interaction`(`userId`);

-- CreateIndex
CREATE INDEX `Interaction_clientId_date_idx` ON `Interaction`(`clientId`, `date`);

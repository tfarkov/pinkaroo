-- Expand Config.value to support larger JSON payloads
ALTER TABLE `Config`
  MODIFY `value` TEXT NULL;

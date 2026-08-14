-- returnReceiptRequestId is many-to-one: a single offboarding return checklist
-- (DocumentRequest) commonly covers several assets returned by the same employee at once.
-- MySQL requires an index backing the FK, so add a plain index before dropping the unique one.
CREATE INDEX `AssetAssignment_returnReceiptRequestId_idx` ON `AssetAssignment`(`returnReceiptRequestId`);

-- DropIndex
DROP INDEX `AssetAssignment_returnReceiptRequestId_key` ON `AssetAssignment`;

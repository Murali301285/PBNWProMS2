-- 1. First, clear all existing VendorCode data so there are no reference conflicts
UPDATE [Master].[TblEquipment]
SET [VendorCode] = NULL;

-- 2. Alter the column to explicitly allow NULLs (Assuming it's an INT referencing the Vendor table's PK)
-- Note: Change 'INT' to 'NVARCHAR(MAX)' or whatever the actual data type of the Vendor PK is, if it's not INT.
ALTER TABLE [Master].[TblEquipment] 
ALTER COLUMN [VendorCode] INT NULL;

-- 3. Add the Foreign Key Constraint
-- Note: Replace 'SlNo' with the actual Primary Key column of the Master.Vendor table if it differs.
ALTER TABLE [Master].[TblEquipment]
ADD CONSTRAINT FK_TblEquipment_VendorCode
FOREIGN KEY ([VendorCode]) REFERENCES [Master].[Vendor]([SlNo]);

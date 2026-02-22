IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblEquipment' AND COLUMN_NAME = 'FuelTypeId')
BEGIN
    ALTER TABLE Master.TblEquipment ADD FuelTypeId INT;
    PRINT 'Column FuelTypeId added to Master.TblEquipment.';
    
    ALTER TABLE Master.TblEquipment WITH CHECK ADD CONSTRAINT [FK_TblEquipment_TblFuelType] FOREIGN KEY([FuelTypeId])
    REFERENCES [Master].[TblFuelType] ([SlNo]);
    PRINT 'Foreign Key constraint FK_TblEquipment_TblFuelType added.';
END
ELSE
BEGIN
    PRINT 'Column FuelTypeId already exists in Master.TblEquipment.';
END
GO

ALTER TABLE [Master].[TblEquipment]
ADD FuelTypeId INT NULL;

ALTER TABLE [Master].[TblEquipment]
ADD CONSTRAINT FK_TblEquipment_FuelTypeId FOREIGN KEY (FuelTypeId)
REFERENCES [Master].[TblFuelType](SlNo);

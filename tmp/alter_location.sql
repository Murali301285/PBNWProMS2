IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Master].[TblLocation]') AND name = 'IsDestination')
BEGIN
    ALTER TABLE [Master].[TblLocation] ADD IsDestination BIT DEFAULT 0 WITH VALUES;
    PRINT 'Column IsDestination added to [Master].[TblLocation]';
END
ELSE
BEGIN
    PRINT 'Column IsDestination already exists in [Master].[TblLocation]';
END

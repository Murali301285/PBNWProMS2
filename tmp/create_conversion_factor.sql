
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblConversionFactor]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblConversionFactor](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [FromDate] [date] NOT NULL,
        [ToDate] [date] NOT NULL,
        [Factor] [decimal](18,2) NOT NULL,
        [Remarks] [nvarchar](max) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0,
        [CreatedBy] [int] DEFAULT 1,
        [CreatedDate] [datetime] DEFAULT GETDATE(),
        [UpdatedBy] [int] NULL,
        [UpdatedDate] [datetime] NULL
    );
    PRINT 'Table [Master].[TblConversionFactor] created.';
END
ELSE
BEGIN
    PRINT 'Table [Master].[TblConversionFactor] already exists.';
END

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblPage]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [Master].[TblPage] WHERE PagePath = '/dashboard/master/conversion-factor')
    BEGIN
        INSERT INTO [Master].[TblPage] (PageName, PagePath, CreatedBy)
        VALUES ('Conversion Factor', '/dashboard/master/conversion-factor', 'System');
        PRINT 'Page registered successfully.';
    END
    ELSE
    BEGIN
        PRINT 'Page already registered.';
    END
END

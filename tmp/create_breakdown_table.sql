IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Report')
BEGIN
    EXEC('CREATE SCHEMA [Report]')
    PRINT 'Created Schema [Report]'
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Report].[TblBreakdownEntry]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Report].[TblBreakdownEntry](
        [SlNo] [bigint] IDENTITY(1,1) NOT NULL,
        [Date] [date] NOT NULL,
        [ShiftId] [int] NOT NULL,
        [ShiftChangeTime] [int] NULL DEFAULT 0, -- Renamed from ShiftInchargeTime
        [Break_TeaTime] [int] NULL DEFAULT 0,
        [BlastingTime] [int] NULL DEFAULT 0,
        [Others] [int] NULL DEFAULT 0,
        [Total] [int] NULL DEFAULT 0, -- Calculated/Stored
        [CreatedDate] [datetime] DEFAULT GETDATE(),
        [ModifiedDate] [datetime] DEFAULT GETDATE(),
        CONSTRAINT [PK_TblBreakdownEntry] PRIMARY KEY CLUSTERED ([SlNo] ASC),
        CONSTRAINT [UQ_Breakdown_Date_Shift] UNIQUE NONCLUSTERED ([Date] ASC, [ShiftId] ASC)
    )
    PRINT 'Created Table [Report].[TblBreakdownEntry]'
END
ELSE
BEGIN
    PRINT 'Table [Report].[TblBreakdownEntry] already exists'
END

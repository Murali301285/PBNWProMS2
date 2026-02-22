const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2102',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

const createTableSql = `
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblLocationType]') AND type in (N'U'))
BEGIN
CREATE TABLE [Master].[TblLocationType](
	[SlNo] [int] IDENTITY(1,1) NOT NULL,
	[LocationType] [nvarchar](150) NULL,
	[Remarks] [nvarchar](max) NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[IsDelete] [bit] NOT NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_TblLocationType_IsActive] DEFAULT ((1)),
	[UploadRemark] [nvarchar](255) NULL,
 CONSTRAINT [PK_TblLocationType] PRIMARY KEY CLUSTERED 
(
	[SlNo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END

IF NOT EXISTS (
    SELECT * FROM sys.objects 
    WHERE object_id = OBJECT_ID(N'[Master].[DF_TblLocationType_IsDelete]') AND type = 'D'
)
BEGIN
ALTER TABLE [Master].[TblLocationType] ADD  CONSTRAINT [DF_TblLocationType_IsDelete]  DEFAULT ((0)) FOR [IsDelete]
END
`;

async function addLocationType() {
    try {
        const pool = await sql.connect(config);
        await pool.request().batch(createTableSql);
        console.log("Success creating TblLocationType");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

addLocationType();

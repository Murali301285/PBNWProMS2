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
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblLocationTypeMapping]') AND type in (N'U'))
BEGIN
CREATE TABLE [Master].[TblLocationTypeMapping](
	[SlNo] [int] IDENTITY(1,1) NOT NULL,
	[LocationId] [int] NOT NULL,
	[LocationTypeId] [int] NOT NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[IsDelete] [bit] NOT NULL CONSTRAINT [DF_TblLocationTypeMapping_IsDelete] DEFAULT ((0)),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_TblLocationTypeMapping_IsActive] DEFAULT ((1)),
 CONSTRAINT [PK_TblLocationTypeMapping] PRIMARY KEY CLUSTERED 
(
	[SlNo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
END
`;

async function createMappingTable() {
    try {
        const pool = await sql.connect(config);
        await pool.request().batch(createTableSql);
        console.log("Success creating TblLocationTypeMapping");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

createMappingTable();

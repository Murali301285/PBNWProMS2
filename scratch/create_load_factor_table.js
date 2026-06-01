const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    database: 'ProMS2_2026',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    port: 1433
};

async function main() {
    try {
        const pool = await sql.connect(config);
        console.log("Connected to DB!");

        const query = `
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblEquipmentLoadFactorMapping]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [Master].[TblEquipmentLoadFactorMapping] (
                    [SlNo] INT IDENTITY(1,1) NOT NULL,
                    [EquipmentId] INT NOT NULL,
                    [MaterialId] INT NOT NULL,
                    [ManagementQtyTrip] DECIMAL(18,2) NULL,
                    [NTPCQtyTrip] DECIMAL(18,2) NULL,
                    [CreatedBy] INT NULL,
                    [CreatedDate] DATETIME NULL,
                    [UpdatedBy] INT NULL,
                    [UpdatedDate] DATETIME NULL,
                    [IsDelete] BIT NOT NULL CONSTRAINT DF_TblEquipmentLoadFactorMapping_IsDelete DEFAULT 0,
                    [IsActive] BIT NOT NULL CONSTRAINT DF_TblEquipmentLoadFactorMapping_IsActive DEFAULT 1,
                    CONSTRAINT [PK_TblEquipmentLoadFactorMapping] PRIMARY KEY CLUSTERED ([SlNo] ASC),
                    CONSTRAINT [UQ_TblEquipmentLoadFactorMapping_Eq_Mat] UNIQUE ([EquipmentId], [MaterialId])
                )
                PRINT 'Table [Master].[TblEquipmentLoadFactorMapping] created successfully!'
            END
            ELSE
            BEGIN
                PRINT 'Table [Master].[TblEquipmentLoadFactorMapping] already exists!'
            END
        `;

        const result = await pool.request().query(query);
        console.log("Result:", result);

        await pool.close();
    } catch (err) {
        console.error(err);
    }
}

main();

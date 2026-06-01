const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    port: 1433
};

async function main() {
    try {
        // Connect to master database first to get the list of all databases
        const masterConfig = { ...config, database: 'master' };
        let pool = await sql.connect(masterConfig);
        console.log("Connected to Master DB!");

        const dbResult = await pool.request().query(`
            SELECT name 
            FROM sys.databases 
            WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')
              AND state_desc = 'ONLINE'
        `);
        
        const dbNames = dbResult.recordset.map(r => r.name);
        console.log("Found databases on server:", dbNames);
        await pool.close();

        // Now iterate and create the table on each database
        for (const dbName of dbNames) {
            console.log(`\n----------------------------------------`);
            console.log(`Migrating database: ${dbName}...`);
            
            const dbConfig = { ...config, database: dbName };
            const dbPool = await new sql.ConnectionPool(dbConfig).connect();
            
            const createTableQuery = `
                IF EXISTS (SELECT * FROM sys.schemas WHERE name = 'Master')
                BEGIN
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
                            [IsDelete] BIT NOT NULL CONSTRAINT DF_TblEquipmentLoadFactorMapping_${dbName.replace(/[^a-zA-Z0-9]/g, '')}_IsDelete DEFAULT 0,
                            [IsActive] BIT NOT NULL CONSTRAINT DF_TblEquipmentLoadFactorMapping_${dbName.replace(/[^a-zA-Z0-9]/g, '')}_IsActive DEFAULT 1,
                            CONSTRAINT [PK_TblEquipmentLoadFactorMapping_${dbName.replace(/[^a-zA-Z0-9]/g, '')}] PRIMARY KEY CLUSTERED ([SlNo] ASC),
                            CONSTRAINT [UQ_TblEquipmentLoadFactorMapping_Eq_Mat_${dbName.replace(/[^a-zA-Z0-9]/g, '')}] UNIQUE ([EquipmentId], [MaterialId])
                        )
                        PRINT 'Table [Master].[TblEquipmentLoadFactorMapping] created successfully in ${dbName}!'
                    END
                    ELSE
                    BEGIN
                        PRINT 'Table [Master].[TblEquipmentLoadFactorMapping] already exists in ${dbName}!'
                    END
                END
                ELSE
                BEGIN
                    PRINT 'Schema [Master] does not exist in ${dbName}. Skipping migration.'
                END
            `;

            const request = dbPool.request();
            const result = await request.query(createTableQuery);
            console.log(`Completed check for ${dbName}.`);
            await dbPool.close();
        }

        console.log("\n✅ All databases migrated safely!");
    } catch (err) {
        console.error("Migration failed:", err);
    }
}

main();

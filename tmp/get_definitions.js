
const mssql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function getDefinitions() {
    try {
        await mssql.connect(config);

        // Get SP Definition
        const spResult = await mssql.query`
            SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.PMS2_New_Sp_LoadingMasterReport')) AS SP_Definition;
        `;

        const spDef = spResult.recordset[0]?.SP_Definition;
        console.log("--- PMS2_New_Sp_LoadingMasterReport Definition ---");
        console.log(spDef ? spDef : "SP Not Found");

        // Get Table Definition
        const tableResult = await mssql.query`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'master' AND TABLE_NAME = 'TblConversionFactor';
        `;

        if (tableResult.recordset.length > 0) {
            console.log("\n--- master.TblConversionFactor Columns ---");
            console.table(tableResult.recordset);
        } else {
            console.log("\n--- master.TblConversionFactor Not Found (checking 'dbo' schema just in case) ---");
            const tableResultDbo = await mssql.query`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'TblConversionFactor';
            `;
            if (tableResultDbo.recordset.length > 0) {
                console.log("\n--- dbo.TblConversionFactor Columns ---");
                console.table(tableResultDbo.recordset);
            } else {
                console.log("Table TblConversionFactor Not Found in master or dbo schema");
            }
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mssql.close();
    }
}

getDefinitions();

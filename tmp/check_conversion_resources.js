
const mssql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_1602',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function checkResources() {
    try {
        await mssql.connect(config);

        // 1. Check Table
        const table = await mssql.query`
            SELECT * FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblConversionFactor'
        `;
        console.log("Table exists:", table.recordset.length > 0);

        // 2. Check Hauling SP
        const spHauling = await mssql.query`
            SELECT OBJECT_ID('dbo.PMS2_New_Sp_HaulingMasterReport') as ID
        `;
        console.log("Hauling SP exists:", !!spHauling.recordset[0]?.ID);

        // 3. Check Daily Progress SP (just to be sure, though I created it)
        const spDaily = await mssql.query`
            SELECT OBJECT_ID('dbo.PMS2_New_Sp_DailyProgressReport') as ID
        `;
        console.log("Daily Progress SP exists:", !!spDaily.recordset[0]?.ID);

    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

checkResources();

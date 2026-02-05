const sql = require('mssql');
const config = require('./lib/dbConfig').default; // Assuming standard traversing - wait, usually I make a standalone config in tmp
// Let's use the standard standalone pattern

const dbConfig = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
};

async function checkData() {
    try {
        await sql.connect(dbConfig);

        console.log("Checking TblLoading ShiftInchargeId population...");
        const result = await sql.query(`
            SELECT TOP 10 SlNo, LoadingDate, ShiftId, ShiftInchargeId 
            FROM [Trans].[TblLoading] 
            ORDER BY LoadingDate DESC
        `);
        console.table(result.recordset);

        console.log("Checking TblLoadingShiftIncharge (Legacy) content...");
        const legacyResult = await sql.query(`
            SELECT TOP 10 * FROM [Trans].[TblLoadingShiftIncharge]
        `);
        console.table(legacyResult.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkData();

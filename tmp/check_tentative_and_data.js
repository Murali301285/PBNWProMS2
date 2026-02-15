
const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_Serv',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
};

const sql = require('mssql');

async function checkTentativeAndData() {
    try {
        console.log(`Connecting to database...`);
        const pool = await new sql.ConnectionPool(config).connect();

        // 1. Check for Tentative Table
        console.log("--- Checking for tables with 'Tentative' in name ---");
        const tableQuery = `
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME LIKE '%Tentative%'
        `;
        const tables = await pool.request().query(tableQuery);
        console.table(tables.recordset);

        // 2. Check Data for 2026-02-15
        const testDate = '2026-02-15';
        console.log(`--- Checking Data for ${testDate} ---`);

        const loadingQuery = `
            SELECT COUNT(*) AS LoadingCount 
            FROM Trans.TblLoading 
            WHERE Cast(LoadingDate as Date) = @Date AND IsDelete = 0
        `;
        const lRes = await pool.request().input('Date', sql.Date, testDate).query(loadingQuery);
        console.log(`Loading Records: ${lRes.recordset[0].LoadingCount}`);

        const readingQuery = `
            SELECT COUNT(*) AS ReadingCount 
            FROM Trans.TblEquipmentReading 
            WHERE Cast(Date as Date) = @Date AND IsDelete = 0
        `;
        const rRes = await pool.request().input('Date', sql.Date, testDate).query(readingQuery);
        console.log(`Reading Records: ${rRes.recordset[0].ReadingCount}`);

        // Check SP output for this date
        const spCall = `EXEC ProMS2_SPReportSectorWiseProduction @Date = '${testDate}'`;
        console.log(`--- Executing SP for ${testDate} ---`);
        const spRes = await pool.request().query(spCall);
        console.log(`SP Record Count: ${spRes.recordset.length}`);
        if (spRes.recordset.length > 0) {
            console.log("First SP Record:", spRes.recordset[0]);
        }


        await pool.close();

    } catch (error) {
        console.error('Error:', error);
    }
}

checkTentativeAndData();

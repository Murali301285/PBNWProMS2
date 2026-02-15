
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

async function checkData() {
    try {
        console.log(`Connecting to database: ${config.database} on ${config.server}`);
        const pool = await new sql.ConnectionPool(config).connect();

        const testDate = '2026-02-01'; // User's screenshot date (DD-MM-YYYY -> YYYY-MM-DD)
        const checkQuery = `
            SELECT COUNT(*) AS RecordCount 
            FROM Trans.TblEquipmentReading R
            WHERE Cast(R.Date as Date) = @Date
              AND R.IsDelete = 0
              -- AND R.ShiftId = @ShiftId -- No shift for now
        `;
        const request = pool.request();
        request.input('Date', sql.Date, testDate);
        const result = await request.query(checkQuery);
        console.log(`--- Checking Data for ${testDate} ---`);
        console.log(`Reading Records: ${result.recordset[0].RecordCount}`);

        const spCall = `EXEC ProMS2_SPReportSectorWiseProduction @Date = '${testDate}'`;
        console.log(`Executing SP: ${spCall}`);
        const spRes = await pool.request().query(spCall);
        console.log(`SP Result Count: ${spRes.recordset.length}`);
        if (spRes.recordset.length > 0) {
            console.log("First SP Record:", spRes.recordset[0]);
        }

        await pool.close();

    } catch (error) {
        console.error('Error executing query:', error);
    }
}

checkData();

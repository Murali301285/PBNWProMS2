
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

async function checkLoading() {
    try {
        console.log(`Connecting to database: ${config.database} on ${config.server}`);
        const pool = await new sql.ConnectionPool(config).connect();

        const testDate = '2026-02-01'; // User's screenshot date
        const checkQuery = `
            SELECT COUNT(*) AS RecordCount 
            FROM Trans.TblLoading L
            WHERE Cast(L.LoadingDate as Date) = @Date
              AND L.IsDelete = 0
        `;
        const request = pool.request();
        request.input('Date', sql.Date, testDate);
        const result = await request.query(checkQuery);
        console.log(`--- Checking Loading Data for ${testDate} ---`);
        console.log(`Loading Records: ${result.recordset[0].RecordCount}`);

        await pool.close();

    } catch (error) {
        console.error('Error executing query:', error);
    }
}

checkLoading();

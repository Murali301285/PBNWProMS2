
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

async function fixDest() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();

        console.log("--- Updating DestinationId for 2026-02-15 ---");
        const query = `
            UPDATE Trans.TblLoading 
            SET DestinationId = 1 
            WHERE Cast(LoadingDate as Date) = '2026-02-15'
        `;
        const result = await pool.request().query(query);
        console.log(`Updated ${result.rowsAffected} rows.`);

        await pool.close();
    } catch (e) {
        console.error(e);
    }
}
fixDest();

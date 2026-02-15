
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

async function checkSchema() {
    try {
        console.log(`Connecting to database: ${config.database} on ${config.server}`);
        const pool = await new sql.ConnectionPool(config).connect();

        const checkQuery = `
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'TblLoading'
            ORDER BY ORDINAL_POSITION
        `;
        const result = await pool.request().query(checkQuery);
        console.log("--- TblLoading Columns ---");
        console.table(result.recordset);

        await pool.close();

    } catch (error) {
        console.error('Error executing query:', error);
    }
}

checkSchema();

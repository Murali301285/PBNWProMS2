const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    connectionTimeout: 300000,
    requestTimeout: 300000,
};

async function checkSP() {
    try {
        await sql.connect(config);
        const result = await sql.query(`
            SELECT SPECIFIC_SCHEMA, ROUTINE_NAME 
            FROM INFORMATION_SCHEMA.ROUTINES 
            WHERE ROUTINE_TYPE = 'PROCEDURE' 
            AND ROUTINE_NAME LIKE '%Breakdown%'
        `);
        console.log("SPs found:", result.recordset);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}
checkSP();

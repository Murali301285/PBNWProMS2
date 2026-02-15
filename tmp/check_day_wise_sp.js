
const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || process.env.DB_NAME || 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkSP() {
    try {
        await sql.connect(config);
        const result = await sql.query("EXEC ProMS2_SPReportDayWiseProduction @Date = '2026-02-15'");
        console.log("Result Set:", result.recordset);
        await sql.close();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkSP();


const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42', // Confirmed from lib/db.js
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_Serv', // Default
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkCols() {
    try {
        await sql.connect(config);
        const result = await sql.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblUser_New' AND TABLE_SCHEMA = 'Master'");
        console.log("Columns:", JSON.stringify(result.recordset.map(c => c.COLUMN_NAME)));
        process.exit(0);
    } catch (err) {
        console.error("SQL Error:", err);
        process.exit(1);
    }
}

checkCols();

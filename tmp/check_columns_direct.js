
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_Serv', // Default, might need to change if user uses a different one
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkCols() {
    try {
        await sql.connect(config);
        const result = await sql.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblUser_New' AND TABLE_SCHEMA = 'Master'");
        console.log("Columns:", result.recordset.map(c => c.COLUMN_NAME));
        process.exit(0);
    } catch (err) {
        console.error("SQL Error:", err);
        process.exit(1);
    }
}

checkCols();

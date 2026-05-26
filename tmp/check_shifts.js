const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2026',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkShifts() {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT * FROM [Master].TblShift`;
        console.log('Shifts:');
        console.table(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkShifts();

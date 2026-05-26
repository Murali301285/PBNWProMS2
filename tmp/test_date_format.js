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

async function testDateFormat() {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT FORMAT(CAST('2026-04-09' AS DATE), 'dd - MMM - yyyy') AS FormattedDate`;
        console.log('Formatted Date Output:', result.recordset[0].FormattedDate);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

testDateFormat();

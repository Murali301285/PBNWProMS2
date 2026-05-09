const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_2203',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function run() {
    try {
        await sql.connect(config);
        const result = await sql.query(`EXEC sp_helptext 'ProMS2_SPReportWaterTankerEntry'`);
        result.recordset.forEach(r => process.stdout.write(r.Text));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();

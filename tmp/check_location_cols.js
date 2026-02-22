const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2102',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

async function checkCols() {
    try {
        const pool = await sql.connect(config);
        const res = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblLocation' AND TABLE_SCHEMA = 'Master'");
        console.log(res.recordset.map(r => r.COLUMN_NAME));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

checkCols();

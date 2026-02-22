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

async function testQuery() {
    try {
        const pool = await sql.connect(config);
        const res = await pool.request().query("SELECT SlNo, MaterialName FROM Master.TblMaterial WHERE IsDelete = 0");
        console.log("Materials:", res.recordset);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

testQuery();

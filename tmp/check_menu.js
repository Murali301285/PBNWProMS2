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

async function checkMenuTable() {
    try {
        const pool = await sql.connect(config);

        // Find tables related to 'menu' or 'page'
        const res = await pool.request().query(`
            SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME LIKE '%Menu%' OR TABLE_NAME LIKE '%Page%'
        `);
        console.table(res.recordset);

        // Let's also check TblPage if it exists
        const pageRes = await pool.request().query("SELECT TOP 5 * FROM Master.TblPage");
        console.log("Master.TblPage sample:", pageRes.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

checkMenuTable();

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

async function checkMenuSchema() {
    try {
        const pool = await sql.connect(config);

        let menuSch = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='TblMenuMaster'");
        console.log("Master.TblMenuMaster Cols:", menuSch.recordset.map(c => c.COLUMN_NAME));

        let pageSch = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='TblPage'");
        console.log("Master.TblPage Cols:", pageSch.recordset.map(c => c.COLUMN_NAME));

        // Also just get a few rows
        let menuData = await pool.request().query("SELECT TOP 5 * FROM Master.TblMenuMaster");
        console.log("\nMenu Data:", menuData.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

checkMenuSchema();

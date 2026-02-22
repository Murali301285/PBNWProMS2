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

async function checkMenuData() {
    try {
        const pool = await sql.connect(config);

        const menuRes = await pool.request().query("SELECT * FROM Master.TblMenuMaster WHERE MenuName LIKE '%Location%' OR ParentId IN (SELECT SlNo FROM Master.TblMenuMaster WHERE MenuName = 'Master') ORDER BY SortOrder");
        console.table(menuRes.recordset);

        const pageRes = await pool.request().query("SELECT * FROM Master.TblPage WHERE PageName LIKE '%Location%' OR PageName LIKE '%Type%'");
        console.table(pageRes.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

checkMenuData();

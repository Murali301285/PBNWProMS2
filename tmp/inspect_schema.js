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

async function inspectSchema() {
    try {
        const pool = await sql.connect(config);

        let res1 = await pool.request().query('SELECT TOP 1 * FROM Trans.TblEquipmentReading');
        console.log("TblEquipmentReading columns:", Object.keys(res1.recordset[0] || {}));

        let res2 = await pool.request().query('SELECT TOP 1 * FROM Trans.TblLoading');
        console.log("TblLoading columns:", Object.keys(res2.recordset[0] || {}));

        let res3 = await pool.request().query('SELECT TOP 1 * FROM Master.TblSector');
        console.log("TblSector columns:", Object.keys(res3.recordset[0] || {}));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

inspectSchema();

const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2102',
    options: { encrypt: false, trustServerCertificate: true, enableArithAbort: true }
};

async function checkData() {
    try {
        await sql.connect(config);
        const result = await sql.query(`
            SELECT TOP 10 Date, ShiftId, PlantId, TotalQty
            FROM Trans.TblCrusher
            WHERE IsDelete = 0
            ORDER BY Date DESC
        `);
        console.log("Recent Crusher Data:", result.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkData();

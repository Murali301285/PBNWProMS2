const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_2203',
    options: { encrypt: false, trustServerCertificate: true }
};

async function run() {
    try {
        await sql.connect(config);
        const result = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblWaterTankerEntry' AND TABLE_SCHEMA = 'Transaction'`);
        console.log("WaterTankerEntry Columns:", result.recordset);

        const res2 = await sql.query(`
            SELECT TABLE_NAME, TABLE_SCHEMA FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME LIKE '%Dest%'`);
        console.log("Tables matching Dest:", res2.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();


const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

async function checkSchema() {
    try {
        await sql.connect(config);

        console.log("--- TblLoading Columns ---");
        const loadingCols = await sql.query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblLoading' AND TABLE_SCHEMA = 'Trans'");
        console.table(loadingCols.recordset);

        console.log("--- TblEquipmentReading Columns ---");
        const readingCols = await sql.query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblEquipmentReading' AND TABLE_SCHEMA = 'Trans'");
        console.table(readingCols.recordset);

        console.log("--- Potential Operator/Employee Tables ---");
        const tables = await sql.query("SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%Employee%' OR TABLE_NAME LIKE '%Operator%' OR TABLE_NAME LIKE '%Driver%'");
        console.table(tables.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkSchema();

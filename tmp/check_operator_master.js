
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

async function checkOperatorTable() {
    try {
        await sql.connect(config);

        console.log("--- Master.TblOperator Columns ---");
        const cols = await sql.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblOperator' AND TABLE_SCHEMA = 'Master'");
        console.table(cols.recordset);

        // Also check Trans.TblEquipmentReadingOperator content just in case
        // console.log("--- Trans.TblEquipmentReadingOperator Sample ---");
        // const sample = await sql.query("SELECT TOP 5 * FROM Trans.TblEquipmentReadingOperator");
        // console.table(sample.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkOperatorTable();

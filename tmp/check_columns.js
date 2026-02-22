
const mssql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_1602',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function checkColumns() {
    try {
        await mssql.connect(config);

        console.log("Checking Trans.TblEquipmentReading columns:");
        let result = await mssql.query`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblEquipmentReading'`;
        console.log(result.recordset.map(r => r.COLUMN_NAME).join(', '));

        console.log("\nChecking Trans.TblLoading columns:");
        result = await mssql.query`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblLoading'`;
        console.log(result.recordset.map(r => r.COLUMN_NAME).join(', '));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mssql.close();
    }
}

checkColumns();

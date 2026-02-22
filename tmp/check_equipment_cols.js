
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

        console.log("--- Master.TblEquipment ---");
        let result = await mssql.query`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblEquipment' ORDER BY ORDINAL_POSITION`;
        result.recordset.forEach(r => console.log(r.COLUMN_NAME));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mssql.close();
    }
}

checkColumns();

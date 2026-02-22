
const mssql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_1602',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkRehandlingCols() {
    try {
        await mssql.connect(config);
        const res = await mssql.query`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblMaterialRehandling' AND TABLE_SCHEMA = 'Trans';
        `;
        console.log("Columns for Trans.TblMaterialRehandling:");
        console.table(res.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

checkRehandlingCols();


const mssql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function checkSchema() {
    try {
        await mssql.connect(config);
        const result = await mssql.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblEquipmentReading' AND TABLE_SCHEMA = 'Trans'
            AND COLUMN_NAME LIKE '%Incharge%'
        `);

        console.table(result.recordset);
    } catch (err) {
        console.error("Error checking schema:", err);
    } finally {
        process.exit();
    }
}

checkSchema();

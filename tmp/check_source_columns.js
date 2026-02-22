
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

async function checkCols() {
    try {
        await mssql.connect(config);
        const res = await mssql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblSource' AND TABLE_SCHEMA = 'Master'
        `);
        console.log(`\nColumns for Master.TblSource:`, res.recordset.map(c => c.COLUMN_NAME));
    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

checkCols();

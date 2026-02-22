
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

async function checkMasterLocs() {
    try {
        await mssql.connect(config);

        const tables = ['TblDestination', 'TblLocation'];

        for (const tbl of tables) {
            const res = await mssql.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${tbl}' AND TABLE_SCHEMA = 'Master';
            `);
            console.log(`\nColumns for Master.${tbl}:`);
            console.table(res.recordset);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

checkMasterLocs();

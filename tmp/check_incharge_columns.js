
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

async function checkColumns() {
    try {
        await mssql.connect(config);

        const tables = ['TblShiftIncharge', 'TblLoadingShiftIncharge'];

        for (const tbl of tables) {
            const schema = tbl.startsWith('TblLoading') ? 'Trans' : 'Master';
            const res = await mssql.query(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${tbl}' AND TABLE_SCHEMA = '${schema}'
            `);
            console.log(`\nColumns for ${schema}.${tbl}:`);
            console.table(res.recordset);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

checkColumns();

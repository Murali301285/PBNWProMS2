
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

async function checkSupplierCols() {
    try {
        await mssql.connect(config);

        const tables = ['TblSMESupplier', 'TblSMECategory'];

        for (const tbl of tables) {
            const res = await mssql.query(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${tbl}' AND TABLE_SCHEMA = 'Master';
            `);
            console.log(`\nColumns for Master.${tbl}:`);
            console.table(res.recordset.map(c => ({ name: c.COLUMN_NAME, type: c.DATA_TYPE })));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

checkSupplierCols();

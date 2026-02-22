
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

async function checkCrusherCols() {
    try {
        await mssql.connect(config);

        const tables = ['TblCrusher', 'TblCrusherStoppage'];

        for (const tbl of tables) {
            const res = await mssql.query(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${tbl}' AND TABLE_SCHEMA = 'Trans';
            `);
            console.log(`\nColumns for Trans.${tbl}:`);
            console.table(res.recordset.map(c => ({ name: c.COLUMN_NAME, type: c.DATA_TYPE })));
        }

        // Check Master Crusher Tables
        const masterRes = await mssql.query`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='Master' AND (TABLE_NAME LIKE '%Crusher%' OR TABLE_NAME LIKE '%Stoppage%');
        `;
        console.log("\nMaster Crushing Tables:", masterRes.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

checkCrusherCols();

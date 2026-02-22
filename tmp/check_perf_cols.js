
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

        const tables = ['TblEquipmentGroup'];
        for (const tbl of tables) {
            const res = await mssql.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${tbl}' AND TABLE_SCHEMA = 'Master'
            `);
            console.log(`\nMaster.${tbl} Columns:`, res.recordset.map(c => c.COLUMN_NAME));
        }

        const transTables = ['TblDispatchEntry'];
        for (const tbl of transTables) {
            const res = await mssql.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${tbl}' AND TABLE_SCHEMA = 'Trans'
            `);
            console.log(`\nTrans.${tbl} Columns:`, res.recordset.map(c => c.COLUMN_NAME));
        }

        // Peek at Equipment Groups data
        const groups = await mssql.query`SELECT * FROM Master.TblEquipmentGroup`;
        console.log("\nEquipment Groups Data:", groups.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

checkCols();

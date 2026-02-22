
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

async function checkEquip() {
    try {
        await mssql.connect(config);
        const res = await mssql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblEquipment' AND TABLE_SCHEMA = 'Master'
        `);
        console.log(`\nColumns for Master.TblEquipment:`, res.recordset.map(c => c.COLUMN_NAME));

        // Also check if there's any table with 'Capacity'
        const capTables = await mssql.query`
            SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE COLUMN_NAME LIKE '%Capacity%'
        `;
        console.log("Tables with Capacity column:", capTables.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

checkEquip();

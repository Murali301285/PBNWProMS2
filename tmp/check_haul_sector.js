
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

async function checkTables() {
    try {
        await mssql.connect(config);

        const haulTables = await mssql.query`
            SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME LIKE '%Haul%'
        `;
        console.log("Hauling Tables:", haulTables.recordset);

        const sectorTables = await mssql.query`
            SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME LIKE '%Sector%'
        `;
        console.log("Sector Tables:", sectorTables.recordset);

        // Check columns for Sector table if exists
        if (sectorTables.recordset.length > 0) {
            const tbl = sectorTables.recordset[0].TABLE_NAME;
            const res = await mssql.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${tbl}' AND TABLE_SCHEMA = 'Master'
            `);
            console.log(`\nColumns for Master.${tbl}:`, res.recordset.map(c => c.COLUMN_NAME));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

checkTables();

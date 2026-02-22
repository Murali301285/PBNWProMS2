
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

async function findDBTables() {
    try {
        await mssql.connect(config);
        const result = await mssql.query`
            SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'Trans' AND (TABLE_NAME LIKE '%Drill%' OR TABLE_NAME LIKE '%Blast%' OR TABLE_NAME LIKE '%Explosive%');
        `;
        console.log("Drilling/Blasting Tables:", result.recordset);
    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

findDBTables();

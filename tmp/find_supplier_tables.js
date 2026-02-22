
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

async function findSupplierTables() {
    try {
        await mssql.connect(config);
        const result = await mssql.query`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'Master' AND (TABLE_NAME LIKE '%SME%' OR TABLE_NAME LIKE '%Supplier%' OR TABLE_NAME LIKE '%Explosive%');
        `;
        console.log("Supplier/Explosive Tables:", result.recordset);
    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

findSupplierTables();

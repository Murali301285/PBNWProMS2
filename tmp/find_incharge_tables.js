
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

async function findTables() {
    try {
        await mssql.connect(config);
        const result = await mssql.query`
            SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME LIKE '%InCharge%' OR TABLE_NAME LIKE '%ShiftDispatch%' OR TABLE_NAME LIKE '%Assign%';
        `;
        console.log("Tables found:", result.recordset);

        // Also check columns in TblShiftDispatch if it exists
        const dispatchCols = await mssql.query`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblShiftDispatch';
        `;
        console.log("TblShiftDispatch Columns:", dispatchCols.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

findTables();

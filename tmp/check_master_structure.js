const sql = require('mssql');

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

async function checkStructure() {
    try {
        await sql.connect(config);

        console.log("--- Master.TblMaterial Columns ---");
        const matSchema = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblMaterial'
        `);
        console.table(matSchema.recordset);

        console.log("\n--- Menu/Page Tables Search ---");
        const tables = await sql.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME LIKE '%Menu%' OR TABLE_NAME LIKE '%Page%' OR TABLE_NAME LIKE '%Auth%'
        `);
        console.table(tables.recordset);

        // If we find them, let's peek at the data to understand how to insert
        // Assuming TblMenu or TblPage
        // console.log("--- TblMenu Sample ---");
        // ...

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkStructure();

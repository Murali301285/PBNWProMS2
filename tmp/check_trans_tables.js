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

async function checkTables() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        console.log("\n--- Trans Tables ---");
        const tables = await sql.query(`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME LIKE '%Dispatch%'
        `);
        console.table(tables.recordset);

        console.log("\n--- Master.TblOperator Schema ---");
        const opSchema = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblOperator'
        `);
        console.table(opSchema.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkTables();

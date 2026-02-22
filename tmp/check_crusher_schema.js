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

async function checkSchema() {
    try {
        await sql.connect(config);

        console.log("--- Trans.TblCrusher Schema ---");
        const schema = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblCrusher'
        `);
        console.table(schema.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkSchema();

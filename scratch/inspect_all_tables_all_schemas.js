const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    database: 'ProMS2_2026',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    port: 1433
};

async function main() {
    try {
        const pool = await sql.connect(config);
        console.log("Connected to DB!");

        const result = await pool.request().query(`
            SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            ORDER BY TABLE_SCHEMA, TABLE_NAME
        `);
        console.log(result.recordset.map(r => `${r.TABLE_SCHEMA}.${r.TABLE_NAME}`).join('\n'));

        await pool.close();
    } catch (err) {
        console.error(err);
    }
}

main();

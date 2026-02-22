const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2102',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

async function dropCol() {
    try {
        const pool = await sql.connect(config);
        await pool.request().query("ALTER TABLE Master.TblLocation DROP COLUMN IsDestination");
        console.log("Dropped IsDestination column.");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

dropCol();

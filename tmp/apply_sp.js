const sql = require('mssql');
const fs = require('fs');

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

async function applySP() {
    try {
        const query = fs.readFileSync('tmp/Clean_PerformanceDashboard_SP.sql', 'utf8');
        const pool = await sql.connect(config);

        // mssql batch execute allows CREATE OR ALTER
        await pool.request().batch(query);
        console.log("Successfully updated SP");
    } catch (err) {
        console.error("Error applying SP: ", err);
    } finally {
        process.exit(0);
    }
}

applySP();


const fs = require('fs');
const sql = require('mssql');
const path = require('path');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

async function run() {
    try {
        console.log("Reading SQL file...");
        const sqlContent = fs.readFileSync(path.join(__dirname, 'create_sp_hauling_master_report.sql'), 'utf8');

        console.log("Connecting to DB...");
        const pool = await sql.connect(config);
        console.log("Connected.");

        console.log("Executing SQL...");
        await pool.request().query(sqlContent);
        console.log("SP Created Successfully.");

        await pool.close();

    } catch (err) {
        console.error("Error:", err);
    }
}

run();

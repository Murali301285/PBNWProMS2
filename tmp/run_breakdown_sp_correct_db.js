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
    },
    connectionTimeout: 300000,
    requestTimeout: 300000,
};

async function run() {
    try {
        await sql.connect(config);
        console.log("Connected to correct DB (ProMS2_2102). Reading SQL file...");

        // Make sure the Report schema exists in this DB
        await sql.query(`
            IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Report')
            BEGIN
                EXEC('CREATE SCHEMA [Report]')
            END
        `);

        let script = fs.readFileSync('tmp/create_sp_breakdown_analysis.sql', 'utf8');

        // Remove the specific schema creation part from the script as it uses GO and we already did it
        script = script.replace(/IF NOT EXISTS \([\s\S]*?GO/im, '');

        const batches = script.split(/^\s*GO\s*$/im).filter(b => b.trim());

        for (let batch of batches) {
            console.log("Executing batch length: " + batch.length);
            await sql.query(batch);
        }

        console.log("Successfully created Breakdown SP in ProMS2_2102!");
        process.exit(0);
    } catch (err) {
        console.error("SQL Error: ", err);
        process.exit(1);
    }
}
run();

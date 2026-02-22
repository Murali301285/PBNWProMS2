const sql = require('mssql');
const fs = require('fs');

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
    },
    connectionTimeout: 300000,
    requestTimeout: 300000,
};

async function run() {
    try {
        await sql.connect(config);
        console.log("Connected to DB. Reading SQL file...");

        let script = fs.readFileSync('tmp/create_sp_breakdown_analysis.sql', 'utf8');
        const batches = script.split(/^\s*GO\s*$/im).filter(b => b.trim());

        for (let batch of batches) {
            console.log("Executing batch length: " + batch.length);
            await sql.query(batch);
        }

        console.log("Successfully created Breakdown SP!");
        process.exit(0);
    } catch (err) {
        console.error("SQL Error: ", err);
        process.exit(1);
    }
}
run();

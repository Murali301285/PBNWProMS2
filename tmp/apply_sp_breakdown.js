const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function run() {
    try {
        console.log(`Connecting to ${config.server}/${config.database}...`);
        await sql.connect(config);

        const sqlFile = path.join(__dirname, 'create_sp_breakdown_analysis.sql');
        const query = fs.readFileSync(sqlFile, 'utf8');

        // Split by GO if necessary, but mssql driver usually handles simple batches or needs splitting.
        // Simple CREATE OR ALTER is usually fine as single statement in recent MSSQL versions via driver if no GO.
        // However, the file has GO. I'll split it.
        const batches = query.split(/\bGO\b/i);

        for (const batch of batches) {
            if (batch.trim().length > 0) {
                console.log('Executing batch...');
                await sql.query(batch);
            }
        }

        console.log('SP created successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();

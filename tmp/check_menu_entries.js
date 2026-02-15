const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 30000
    }
};

async function run() {
    try {
        await sql.connect(config);
        const script = fs.readFileSync(path.join(__dirname, 'check_report_menu.sql'), 'utf8');
        // Split by simple newline/semicolon if needed, but sql.query can handle batched if not using GO.
        // check_report_menu.sql has two SELECTs. sql.query returns recordsets.

        const result = await sql.query(script);
        console.log('Recordsets:', result.recordsets.length);
        result.recordsets.forEach((set, i) => {
            console.log(`Result Set ${i + 1}:`, set);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();

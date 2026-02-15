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

        const sqlFile = path.join(__dirname, 'create_breakdown_table.sql');
        const query = fs.readFileSync(sqlFile, 'utf8');

        console.log('Executing SQL...');
        const result = await sql.query(query);

        console.log('Result:', result);
        console.log('Schema applied successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();

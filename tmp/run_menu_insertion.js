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
        const scriptPath = path.join(__dirname, 'insert_hauling_report_menu.sql');
        const script = fs.readFileSync(scriptPath, 'utf8');

        console.log('Executing menu insertion script...');
        // Execute the script
        await sql.query(script);
        console.log('Menu insertion script executed successfully.');

        process.exit(0);
    } catch (err) {
        console.error('Error executing script:', err);
        process.exit(1);
    }
}

run();

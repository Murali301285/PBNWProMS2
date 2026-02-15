const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 30000 // Increase timeout to 30s
    }
};

async function runScript() {
    try {
        await sql.connect(config);
        const scriptPath = path.join(__dirname, 'create_conversion_factor.sql');
        const script = fs.readFileSync(scriptPath, 'utf8');

        console.log('Executing script...');
        await sql.query(script);
        console.log('Script executed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error executing script:', err);
        process.exit(1);
    }
}

runScript();

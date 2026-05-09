const fs = require('fs');
const sql = require('mssql');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const config = {
    user: env.DB_USER || 'sa',
    password: env.DB_PASSWORD,
    server: env.DB_SERVER || '127.0.0.1',
    database: env.DB_DATABASE || 'ProMS2_1203',
    port: parseInt(env.DB_PORT || '1433'),
    options: {
        encrypt: false,
        trustServerCertificate: true,
    }
};

async function main() {
    try {
        await sql.connect(config);
        const result = await sql.query(`SELECT OBJECT_DEFINITION(OBJECT_ID('PMS2_New_Dash_SP_GetAnalyticalStats')) AS sp_definition;`);
        fs.writeFileSync('f:/Dev/ProMS/ProMSDev/tmp/sp_dash_analytical.sql', result.recordset[0].sp_definition);
        console.log("Saved to tmp/sp_dash_analytical.sql");
    } catch (e) {
        console.error(e);
    } finally {
        await sql.close();
    }
}
main();

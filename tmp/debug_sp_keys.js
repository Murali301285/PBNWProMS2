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
        console.log("Connected!");
        
        const request = new sql.Request();
        request.input('FromDate', sql.Date, '2026-02-17');
        request.input('ToDate', sql.Date, '2026-02-17');
        const result = await request.execute('[dbo].[PMS2_New_Sp_OperatorPerformanceLoadingReport]');
        
        if (result.recordsets.length > 0 && result.recordsets[0].length > 0) {
            console.log("Keys returned:", Object.keys(result.recordsets[0][0]));
        } else {
            console.log("No data returned for 2026-02-17");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await sql.close();
    }
}
main();

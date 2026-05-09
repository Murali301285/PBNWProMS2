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
        const result = await sql.query(`
            EXEC PMS2_New_Dash_SP_GetAnalyticalStats 
                @FromDate = '2026-03-01', 
                @ToDate = '2026-03-12', 
                @LoadingModel = NULL, 
                @HaulingModel = NULL
        `);
        console.log(`Executed fully. ResultSets: ${result.recordsets.length}`);
    } catch (e) {
        console.error("Test Query Error:", e);
    } finally {
        await sql.close();
    }
}
main();

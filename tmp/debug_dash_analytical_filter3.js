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
        
        console.log("=== EXECUTING WITH FILTER (Loading='EX_1200_1') ===");
        const req3 = new sql.Request();
        req3.input('FromDate', sql.Date, '2026-02-17');
        req3.input('ToDate', sql.Date, '2026-02-17');
        req3.input('LoadingModel', sql.NVarChar, 'EX_1200_1');
        req3.input('HaulingModel', sql.NVarChar, null);
        const res3 = await req3.execute('PMS2_New_Dash_SP_GetAnalyticalStats');
        console.log(`Loading Array Length: ${res3.recordsets[3].length}`);
        if(res3.recordsets[3].length > 0) {
            console.log("First Loading Model:", res3.recordsets[3][0].EquipmentName);
        }

    } catch (e) {
        console.error("Test Query Error:", e);
    } finally {
        await sql.close();
    }
}
main();

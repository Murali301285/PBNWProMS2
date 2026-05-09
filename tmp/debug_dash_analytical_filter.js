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
        
        console.log("=== EXECUTING WITHOUT FILTERS ===");
        const req1 = new sql.Request();
        req1.input('FromDate', sql.Date, '2026-03-01');
        req1.input('ToDate', sql.Date, '2026-03-12');
        req1.input('LoadingModel', sql.NVarChar, null);
        req1.input('HaulingModel', sql.NVarChar, null);
        const res1 = await req1.execute('PMS2_New_Dash_SP_GetAnalyticalStats');
        console.log(`Hauling Array Length: ${res1.recordsets[2].length}`);

        console.log("\n=== EXECUTING WITH FILTER (Loading='EX_900_906', Hauling='BH-100E') ===");
        const req2 = new sql.Request();
        req2.input('FromDate', sql.Date, '2026-03-01');
        req2.input('ToDate', sql.Date, '2026-03-12');
        req2.input('LoadingModel', sql.NVarChar, 'EX_900_906');
        req2.input('HaulingModel', sql.NVarChar, 'BH-100E');
        const res2 = await req2.execute('PMS2_New_Dash_SP_GetAnalyticalStats');
        console.log(`Hauling Array Length: ${res2.recordsets[2].length}`);
        if(res2.recordsets[2].length > 0) {
            console.log("First Entry:", res2.recordsets[2][0]);
        }

    } catch (e) {
        console.error("Test Query Error:", e);
    } finally {
        await sql.close();
    }
}
main();

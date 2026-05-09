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
        
        let spDef = fs.readFileSync('f:/Dev/ProMS/ProMSDev/tmp/sp_dash_analytical.sql', 'utf8');
        
        // Use regex with \s+ to handle any amount of whitespace
        spDef = spDef.replace(
            /@FromDate\s+DATE,\s+@ToDate\s+DATE/gi,
            `@FromDate  DATE, \n    @ToDate  DATE, \n    @HaulingModel NVARCHAR(100) = NULL, \n    @LoadingModel NVARCHAR(100) = NULL`
        );
        
        spDef = spDef.replace(/CREATE\s+PROCEDURE/i, 'ALTER PROCEDURE');

        // Hauling Chart Replacement
        spDef = spDef.replace(
            /AND\s+R\.IsDelete\s*=\s*0\n\s*AND\s+R\.ActivityId\s*=\s*4[^\n]*\n\s*AND\s+CAST\(R\.Date\s+AS\s+DATE\)\s+BETWEEN\s+@FromDate\s+AND\s+@ToDate\n\s*AND\s+E\.IsDelete\s*=\s*0/i,
            `AND R.IsDelete = 0 \n      AND R.ActivityId = 4 -- Hauling \n      AND CAST(R.Date AS DATE) BETWEEN @FromDate AND @ToDate \n      AND E.IsDelete = 0 \n      AND (@HaulingModel IS NULL OR E.Model = @HaulingModel)`
        );

        // Loading Chart Replacement
        spDef = spDef.replace(
            /AND\s+R\.IsDelete\s*=\s*0\n\s*AND\s+R\.ActivityId\s*=\s*3[^\n]*\n\s*AND\s+CAST\(R\.Date\s+AS\s+DATE\)\s+BETWEEN\s+@FromDate\s+AND\s+@ToDate\n\s*AND\s+E\.IsDelete\s*=\s*0/i,
            `AND R.IsDelete = 0 \n      AND R.ActivityId = 3 -- Loading \n      AND CAST(R.Date AS DATE) BETWEEN @FromDate AND @ToDate \n      AND E.IsDelete = 0 \n      AND (@LoadingModel IS NULL OR E.Model = @LoadingModel)`
        );

        if(!spDef.includes('@HaulingModel')) {
            console.error("FAILED TO REPLACE HEADERS");
            return;
        }

        await sql.query(spDef);
        console.log("Analytical SP correctly updated with Model filters!");
    } catch (e) {
        console.error("Error updating Analytical SP:", e);
    } finally {
        await sql.close();
    }
}
main();

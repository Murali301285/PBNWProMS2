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
        
        let spDef = fs.readFileSync('tmp/sp_dash_analytical.sql', 'utf8');
        
        // Let's modify the procedure declaration to include the new parameters
        spDef = spDef.replace(
            `@FromDate DATE,\n                                                                                                                                                                                                                                           \n    @ToDate DATE`,
            `@FromDate DATE,\n    @ToDate DATE,\n    @HaulingModel NVARCHAR(100) = NULL,\n    @LoadingModel NVARCHAR(100) = NULL`
        );
        spDef = spDef.replace(/CREATE\s+PROCEDURE/i, 'ALTER PROCEDURE');

        // Modify Hauling chart query
        spDef = spDef.replace(
            `WHERE R.IsDelete = 0\n      AND R.ActivityId = 4 -- Hauling Activity\n      AND CAST(R.Date AS DATE) BETWEEN @FromDate AND @ToDate\n      AND E.IsDelete = 0`,
            `WHERE R.IsDelete = 0\n      AND R.ActivityId = 4 -- Hauling Activity\n      AND CAST(R.Date AS DATE) BETWEEN @FromDate AND @ToDate\n      AND E.IsDelete = 0\n      AND (@HaulingModel IS NULL OR E.Model = @HaulingModel)`
        );

        // Modify Loading chart query
        spDef = spDef.replace(
            `WHERE R.IsDelete = 0\n      AND R.ActivityId = 3 -- Loading Activity\n      AND CAST(R.Date AS DATE) BETWEEN @FromDate AND @ToDate\n      AND E.IsDelete = 0`,
            `WHERE R.IsDelete = 0\n      AND R.ActivityId = 3 -- Loading Activity\n      AND CAST(R.Date AS DATE) BETWEEN @FromDate AND @ToDate\n      AND E.IsDelete = 0\n      AND (@LoadingModel IS NULL OR E.Model = @LoadingModel)`
        );

        await sql.query(spDef);
        console.log("Analytical SP updated with Model filters!");
    } catch (e) {
        console.error("Error updating Analytical SP:", e);
    } finally {
        await sql.close();
    }
}
main();

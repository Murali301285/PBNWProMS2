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

        // Check if the parameter replacement is needed
        if (!spDef.includes('@LoadingModel')) {
            spDef = spDef.replace(
                /@FromDate\s+DATE,\s*@ToDate\s+DATE/gi,
                `@FromDate DATE, \n    @ToDate DATE, \n    @HaulingModel NVARCHAR(100) = NULL, \n    @LoadingModel NVARCHAR(100) = NULL`
            );
        }

        spDef = spDef.replace(/CREATE\s+PROCEDURE/i, 'ALTER PROCEDURE');

        // Hauling Activity Replacement
        // Look for: AND R.ActivityId = 4 
        // Then replace the first 'GROUP BY E.EquipmentName' we see after it with the filter
        
        let haulingIndex = spDef.indexOf('AND R.ActivityId = 4');
        if (haulingIndex !== -1) {
            let groupByIndex = spDef.indexOf('GROUP BY E.EquipmentName', haulingIndex);
            if (groupByIndex !== -1 && !spDef.substring(haulingIndex, groupByIndex).includes('@HaulingModel')) {
                spDef = spDef.substring(0, groupByIndex) + 
                        '  AND (@HaulingModel IS NULL OR E.Model = @HaulingModel)\n    ' + 
                        spDef.substring(groupByIndex);
            }
        }

        // Loading Activity Replacement
        let loadingIndex = spDef.indexOf('AND R.ActivityId = 3');
        if (loadingIndex !== -1) {
            let groupByIndex = spDef.indexOf('GROUP BY E.EquipmentName', loadingIndex);
            if (groupByIndex !== -1 && !spDef.substring(loadingIndex, groupByIndex).includes('@LoadingModel')) {
                spDef = spDef.substring(0, groupByIndex) + 
                        '  AND (@LoadingModel IS NULL OR E.Model = @LoadingModel)\n    ' + 
                        spDef.substring(groupByIndex);
            }
        }


        if(!spDef.includes('OR E.Model = @LoadingModel')) {
            console.error("FAILED TO INJECT FILTERS.");
            return;
        }

        await sql.query(spDef);
        console.log("Analytical SP correctly updated with Model filters (Hauling/Loading logic inserted)!");
    } catch (e) {
        console.error("Error updating Analytical SP:", e);
    } finally {
        await sql.close();
    }
}
main();

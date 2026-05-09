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

        // Target the specific lines
        const targetHauling = "AND E.IsDelete = 0\r\n    GROUP BY E.EquipmentName";
        const replaceHauling = "AND E.IsDelete = 0\r\n      AND (@HaulingModel IS NULL OR E.Model = @HaulingModel)\r\n    GROUP BY E.EquipmentName";

        const targetLoading = "AND E.IsDelete = 0\r\n    GROUP BY E.EquipmentName";
        const replaceLoading = "AND E.IsDelete = 0\r\n      AND (@LoadingModel IS NULL OR E.Model = @LoadingModel)\r\n    GROUP BY E.EquipmentName";

        // To make sure we replace the RIGHT ones:
        // Hauling is first occurrence after "Hauling Activity"
        let parts = spDef.split('-- Hauling Activity');
        if (parts.length > 1) {
            parts[1] = parts[1].replace(targetHauling, replaceHauling);
            spDef = parts.join('-- Hauling Activity');
        }

        parts = spDef.split('-- Loading Activity');
        if (parts.length > 1) {
            parts[1] = parts[1].replace(targetLoading, replaceLoading);
            spDef = parts.join('-- Loading Activity');
        }

        spDef = spDef.replace(/CREATE\s+PROCEDURE/i, 'ALTER PROCEDURE');

        if (!spDef.includes('@LoadingModel NVARCHAR(100) = NULL')) {
            spDef = spDef.replace(
                /@FromDate\s+DATE,\r?\n\s*@ToDate\s+DATE/gi,
                `@FromDate DATE, \n    @ToDate DATE, \n    @HaulingModel NVARCHAR(100) = NULL, \n    @LoadingModel NVARCHAR(100) = NULL`
            );
        }

        if(!spDef.includes('OR E.Model = @LoadingModel')) {
            console.error("FAILED TO INJECT FILTERS.");
            console.log(spDef.substring(spDef.indexOf('4. Loading Chart')));
            return;
        }

        await sql.query(spDef);
        console.log("Analytical SP correctly updated with EXACT Model filters (Hauling/Loading logic inserted)!");
    } catch (e) {
        console.error("Error updating Analytical SP:", e);
    } finally {
        await sql.close();
    }
}
main();

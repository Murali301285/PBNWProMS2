const sql = require('mssql');

async function main() {
    const config = {
        user: 'sa',
        password: '123',
        server: '127.0.0.1',
        database: 'ProMS2',
        options: {
            encrypt: false,
            trustServerCertificate: true,
            port: 1433
        }
    };

    try {
        await sql.connect(config);
        
        const spName = 'PMS2_New_Dash_SP_GetAnalyticalStats';
        const result = await sql.query(`
            SELECT OBJECT_DEFINITION(OBJECT_ID('${spName}')) AS sp_definition;
        `);

        if (result.recordset.length > 0 && result.recordset[0].sp_definition) {
            const fs = require('fs');
            fs.writeFileSync('f:/Dev/ProMS/ProMSDev/tmp/sp_dash_analytical.sql', result.recordset[0].sp_definition);
            console.log(`Successfully saved ${spName} to tmp/sp_dash_analytical.sql`);
        } else {
            console.log(`Stored procedure ${spName} not found.`);
        }

    } catch (err) {
        console.error('SQL error', err);
    } finally {
        await sql.close();
    }
}

main();

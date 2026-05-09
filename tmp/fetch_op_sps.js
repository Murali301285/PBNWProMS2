const sql = require('mssql');

async function main() {
    const config = {
        user: 'sa',
        password: '123',
        server: '127.0.0.1',
        database: 'ProMS2_1203', // Use the updated database name if applicable, or ProMS2
        options: {
            encrypt: false,
            trustServerCertificate: true,
            port: 1433
        }
    };

    try {
        await sql.connect(config);
        
        let spName = 'PMS2_New_Sp_OperatorPerformanceLoadingReport';
        let result = await sql.query(`SELECT OBJECT_DEFINITION(OBJECT_ID('${spName}')) AS sp_definition;`);
        const fs = require('fs');
        if (result.recordset.length > 0 && result.recordset[0].sp_definition) {
            fs.writeFileSync('f:/Dev/ProMS/ProMSDev/tmp/sp_op_load.sql', result.recordset[0].sp_definition);
            console.log(`Saved ${spName}`);
        } else {
            console.log(`${spName} not found.`);
        }

        spName = 'PMS2_New_Sp_OperatorPerformanceHaulingReport';
        result = await sql.query(`SELECT OBJECT_DEFINITION(OBJECT_ID('${spName}')) AS sp_definition;`);
        if (result.recordset.length > 0 && result.recordset[0].sp_definition) {
            fs.writeFileSync('f:/Dev/ProMS/ProMSDev/tmp/sp_op_haul.sql', result.recordset[0].sp_definition);
            console.log(`Saved ${spName}`);
        } else {
            console.log(`${spName} not found.`);
        }

    } catch (err) {
        console.error('SQL error', err);
    } finally {
        await sql.close();
    }
}

main();

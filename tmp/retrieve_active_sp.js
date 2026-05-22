const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2026',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function retrieveSP() {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT OBJECT_DEFINITION(OBJECT_ID('PMS2_New_Sp_DailyProductionReport')) AS SpDefinition`;
        if (result.recordset.length > 0 && result.recordset[0].SpDefinition) {
            const definition = result.recordset[0].SpDefinition;
            fs.writeFileSync(path.join(__dirname, 'active_daily_production_sp.sql'), definition, 'utf-8');
            console.log('✅ Active SP definition written to tmp/active_daily_production_sp.sql successfully!');
            process.exit(0);
        } else {
            console.log('❌ SP not found or definition empty.');
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

retrieveSP();

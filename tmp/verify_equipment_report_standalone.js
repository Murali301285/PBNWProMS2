
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

async function testEquipmentReport() {
    try {
        await sql.connect(config);
        const date = '2024-05-30'; // Sample date

        console.log(`Testing Equipment Performance Report for ${date}...`);

        const request = new sql.Request();
        request.input('Date', date);
        request.input('ActivityIds', sql.NVarChar, '');
        request.input('EquipmentIds', sql.NVarChar, '');

        const result = await request.query(`
            EXEC PMS2_New_Sp_EquipmentPerformanceReport 
            @Date = @Date, 
            @ActivityIds = @ActivityIds,
            @EquipmentIds = @EquipmentIds
        `);

        console.log(`Report returned ${result.recordset.length} rows.`);
        if (result.recordset.length > 0) {
            console.table(result.recordset.slice(0, 5)); // Show first 5 rows
        } else {
            console.warn("No data returned. Check filter criteria or date.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

testEquipmentReport();

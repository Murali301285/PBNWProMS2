
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_Serv',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
};

async function inspectCrusher() {
    try {
        console.log(`Connecting to database: ${config.database} on ${config.server}`);
        const pool = await new sql.ConnectionPool(config).connect();

        console.log("--- TblCrusher Data (Top 5) NO ORDER ---");
        const resCrusher = await pool.request().query("SELECT TOP 5 * FROM Trans.TblCrusher");
        if (resCrusher.recordset.length > 0) {
            console.log("Has rows:", resCrusher.recordset.length);
            console.log("Keys:", Object.keys(resCrusher.recordset[0]));
            console.log(resCrusher.recordset);
        } else {
            console.log("No data in TblCrusher");
            console.log("--- TblCrusher Columns from Schema ---");
            const resCrusherCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblCrusher'");
            console.log(resCrusherCols.recordset.map(r => r.COLUMN_NAME));
        }

        console.log("--- Searching Equipment Names with 'Pump' ---");
        const resMyPump = await pool.request().query("SELECT TOP 5 * FROM Master.TblEquipment WHERE EquipmentName LIKE '%Pump%' OR EquipmentName LIKE '%Dewater%'");
        console.log(resMyPump.recordset);

        if (resMyPump.recordset.length > 0) {
            // Try to find readings for the first pump found
            const pumpId = resMyPump.recordset[0].EquipmentId || resMyPump.recordset[0].EuipmentID; // Note typo in column name usually found in these dbs
            console.log(`Pump ID found: ${pumpId}`);

            if (pumpId) {
                console.log(`--- Checking Readings for PumpId: ${pumpId} ---`);
                const resReading = await pool.request().query(`SELECT TOP 5 * FROM Trans.TblEquipmentReading WHERE EquipmentId = ${pumpId}`);
                console.log(resReading.recordset);
            }
        }

        await pool.close();

    } catch (error) {
        console.error('Error executing query:', error);
    }
}

inspectCrusher();

const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_1602',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkKom255() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        // 1. Find ID
        const eqResult = await sql.query(`SELECT SlNo, EquipmentName, PMSCode FROM Master.TblEquipment WHERE EquipmentName = 'Kom-255'`);
        if (eqResult.recordset.length === 0) {
            console.log("Kom-255 not found");
            return;
        }
        const eqId = eqResult.recordset[0].SlNo;
        console.log(`Found Kom-255 (ID: ${eqId})`);

        // 2. Check Reading for 2026-02-01
        const reading = await sql.query(`
            SELECT TotalWorkingHr 
            FROM Trans.TblEquipmentReading 
            WHERE EquipmentId = ${eqId} AND CAST(Date AS DATE) = '2026-02-01' AND IsDelete = 0
        `);
        console.log("Reading Entries:", reading.recordset);

        // 3. Execute SP
        const result = await sql.query(`
            EXEC PMS2_New_Sp_EquipmentPerformanceReport @Date = '2026-02-01'
        `);

        const row = result.recordset.find(r => r.Equipment === 'Kom-255');
        if (row) {
            console.log("\nSP Result for Kom-255:");
            console.log(row);
        } else {
            console.log("\nKom-255 not found in SP result.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkKom255();

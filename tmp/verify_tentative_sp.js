
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
};

const sql = require('mssql');

async function checkTentativeSP() {
    try {
        console.log(`Connecting to database...`);
        const pool = await new sql.ConnectionPool(config).connect();

        const testDate = '2026-02-15';
        const shiftId = 1; // Assuming Shift 1 has data from previous insertion

        console.log(`--- Executing Tentative SP for ${testDate}, Shift ${shiftId} ---`);
        const spCall = `EXEC ProMS2_SPReportTentativeProduction @Date = '${testDate}', @ShiftId = ${shiftId}`;
        const spRes = await pool.request().query(spCall);

        console.log(`Total Result Sets: ${spRes.recordsets.length}`);

        // Check result sets based on SP logic:
        // 1. Waste Handling?
        // 2. Coal Production?
        // ... SP has multiple SELECT statements

        spRes.recordsets.forEach((rs, idx) => {
            console.log(`Result Set ${idx + 1}: ${rs.length} records`);
            if (rs.length > 0) console.log(`Sample:`, rs[0]);
        });


        await pool.close();

    } catch (error) {
        console.error('Error:', error);
    }
}

checkTentativeSP();


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

async function run() {
    try {
        console.log("Connecting to DB...");
        const pool = await sql.connect(config);
        console.log("Connected.");

        // Test Loading Master Report
        console.log("\n--- Testing Loading Master Report ---");
        const loadingReq = pool.request();
        loadingReq.input('FromDate', sql.Date, new Date('2024-01-01'));
        loadingReq.input('ToDate', sql.Date, new Date('2025-01-01'));
        loadingReq.input('ShiftIds', sql.VarChar, null);
        loadingReq.input('OperatorIds', sql.VarChar, null);
        loadingReq.input('LoadingMachineIds', sql.VarChar, null);
        loadingReq.input('LoadingModelIds', sql.VarChar, null);
        loadingReq.input('RelayIds', sql.VarChar, null);
        loadingReq.input('SectorIds', sql.VarChar, null);
        loadingReq.input('PatchIds', sql.VarChar, null);
        loadingReq.input('MethodIds', sql.VarChar, null);

        try {
            const loadingRes = await loadingReq.execute('PMS2_New_Sp_LoadingMasterReport');
            console.log(`Loading Master Report returned ${loadingRes.recordset.length} rows.`);
            if (loadingRes.recordset.length > 0) {
                console.log("Sample Row:", loadingRes.recordset[0]);
            }
        } catch (err) {
            console.error("Loading Master Report Failed:", err.message);
        } // Start of Selection


        // Test Hauling Master Report
        console.log("\n--- Testing Hauling Master Report ---");
        const haulingReq = pool.request();
        haulingReq.input('fromDateInput', sql.Date, new Date('2024-01-01'));
        haulingReq.input('toDateInput', sql.Date, new Date('2025-01-01'));
        haulingReq.input('shiftIds', sql.VarChar, null);
        haulingReq.input('operatorIds', sql.VarChar, null);
        haulingReq.input('haulerIds', sql.VarChar, null);
        haulingReq.input('haulerModelIds', sql.VarChar, null);

        try {
            const haulingRes = await haulingReq.execute('PMS2_New_Sp_HaulingMasterReport');
            console.log(`Hauling Master Report returned ${haulingRes.recordset.length} rows.`);
            if (haulingRes.recordset.length > 0) {
                console.log("Sample Row:", haulingRes.recordset[0]);
            }
        } catch (err) {
            console.error("Hauling Master Report Failed:", err.message);
        }

        await pool.close();

    } catch (err) {
        console.error("Global Error:", err);
    }
}

run();

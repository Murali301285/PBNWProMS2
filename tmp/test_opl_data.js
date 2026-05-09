const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_2026',
    options: { encrypt: false, trustServerCertificate: true }
};

async function run() {
    try {
        await sql.connect(config);
        
        const request = new sql.Request();
        request.input('FromDate', sql.Date, '2026-04-01');
        request.input('ToDate', sql.Date, '2026-04-02');
        request.input('ShiftIds', sql.NVarChar(sql.MAX), null);
        request.input('OperatorIds', sql.NVarChar(sql.MAX), null);
        request.input('LoadingMachineIds', sql.NVarChar(sql.MAX), null);
        request.input('SectorIds', sql.NVarChar(sql.MAX), null);
        request.input('ActivityIds', sql.NVarChar(sql.MAX), null);

        const result = await request.execute('[dbo].[PMS2_New_Sp_OperatorPerformanceLoadingReport]');
        
        const data = result.recordsets[0];
        // find indices where date goes backwards
        for(let i=1; i<data.length; i++) {
            let prevDate = data[i-1].Date;
            let currDate = data[i].Date;
            
            // convert 'dd-MMM-yyyy' to comparable value
            let prevD = new Date(prevDate);
            let currD = new Date(currDate);
            
            if (currD < prevD) {
                console.log(`ORDER INVERSION AT INDEX ${i}:`);
                console.log(`Row ${i-1}: ${data[i-1].SlNo} - ${prevDate} - ${data[i-1]["OPERATOR'S NAME"]}`);
                console.log(`Row ${i}: ${data[i].SlNo} - ${currDate} - ${data[i]["OPERATOR'S NAME"]}`);
            }
        }
        console.log("Done checking inversions.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();

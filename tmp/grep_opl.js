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

        const shajad = data.filter(d => String(d["OPERATOR'S NAME"]).includes('Sahjad'));
        console.log("Found Sahjad rows:", shajad.length);
        console.dir(shajad);

        const allMapped = data.map(d => ({sl: d.SlNo, date: d.Date}));
        console.log("Total entries:", allMapped.length);
        
        // Let's mimic what String sort on SlNo would do
        const sortedAsString = [...data].sort((a,b) => String(a.SlNo) < String(b.SlNo) ? -1 : 1);
        
        const sahadInSorted = sortedAsString.findIndex(d => String(d["OPERATOR'S NAME"]).includes('Sahjad'));
        console.log("Sahjad index in string-sorted SlNo array:", sahadInSorted);
        
        if (sahadInSorted >= 0) {
            console.log("Prev:", sortedAsString[sahadInSorted-1]?.SlNo, sortedAsString[sahadInSorted-1]?.Date, sortedAsString[sahadInSorted-1]?.["OPERATOR'S NAME"]);
            console.log("Curr:", sortedAsString[sahadInSorted]?.SlNo, sortedAsString[sahadInSorted]?.Date, sortedAsString[sahadInSorted]?.["OPERATOR'S NAME"]);
            console.log("Next:", sortedAsString[sahadInSorted+1]?.SlNo, sortedAsString[sahadInSorted+1]?.Date, sortedAsString[sahadInSorted+1]?.["OPERATOR'S NAME"]);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();

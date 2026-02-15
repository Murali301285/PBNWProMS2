
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

async function fetchIds() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();

        console.log("--- Equipment ---");
        const eq = await pool.request().query("SELECT TOP 5 SlNo, EquipmentName FROM Master.TblEquipment");
        console.table(eq.recordset);

        console.log("--- Material ---");
        const mat = await pool.request().query("SELECT TOP 5 SlNo, MaterialName FROM Master.TblMaterial WHERE MaterialName IN ('TOP SOIL', 'OVER BURDEN', 'INTER BURDEN', 'OB', 'TS', 'IB')");
        console.table(mat.recordset);

        console.log("--- Shift ---");
        const sh = await pool.request().query("SELECT TOP 5 SlNo, ShiftName FROM Master.TblShift");
        console.table(sh.recordset);

        console.log("--- Sector ---");
        const sec = await pool.request().query("SELECT TOP 5 SlNo, SectorName FROM Master.TblSector");
        console.table(sec.recordset);

        console.log("--- Patch ---");
        const pat = await pool.request().query("SELECT TOP 5 SlNo, Name FROM Master.TblPatch");
        console.table(pat.recordset);

        console.log("--- Method ---");
        const meth = await pool.request().query("SELECT TOP 5 SlNo, Name FROM Master.TblMethod");
        console.table(meth.recordset);

        await pool.close();
    } catch (e) { console.error(e); }
}
fetchIds();

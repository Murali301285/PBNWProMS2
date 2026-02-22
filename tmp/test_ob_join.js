const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2102',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

async function testJoinDifference() {
    try {
        const pool = await sql.connect(config);

        let resInner = await pool.request().query(`
            DECLARE @FromDate DATE = '2026-02-01';
            DECLARE @ToDate DATE = '2026-02-18';
            WITH EquipSectors AS (
                SELECT DISTINCT ER.EquipmentId, CAST(ER.Date AS DATE) AS Date, ER.ShiftId, ER.SectorId
                FROM Trans.TblEquipmentReading ER WHERE ER.IsDelete = 0 AND CAST(ER.Date AS DATE) BETWEEN @FromDate AND @ToDate
            )
            SELECT SUM(L.TotalQty) AS SumInner
            FROM Trans.TblLoading L
            JOIN EquipSectors ES ON L.LoadingMachineEquipmentId = ES.EquipmentId AND L.ShiftId = ES.ShiftId AND CAST(L.LoadingDate AS DATE) = ES.Date
            WHERE L.IsDelete = 0 AND CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate
        `);

        let resLeft = await pool.request().query(`
            DECLARE @FromDate DATE = '2026-02-01';
            DECLARE @ToDate DATE = '2026-02-18';
            WITH EquipSectors AS (
                SELECT DISTINCT ER.EquipmentId, CAST(ER.Date AS DATE) AS Date, ER.ShiftId, ER.SectorId
                FROM Trans.TblEquipmentReading ER WHERE ER.IsDelete = 0 AND CAST(ER.Date AS DATE) BETWEEN @FromDate AND @ToDate
            )
            SELECT SUM(L.TotalQty) AS SumLeft
            FROM Trans.TblLoading L
            LEFT JOIN EquipSectors ES ON L.LoadingMachineEquipmentId = ES.EquipmentId AND L.ShiftId = ES.ShiftId AND CAST(L.LoadingDate AS DATE) = ES.Date
            WHERE L.IsDelete = 0 AND CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate
        `);

        console.log("Inner Join Sum: ", resInner.recordset[0].SumInner);
        console.log("Left Join Sum:  ", resLeft.recordset[0].SumLeft);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

testJoinDifference();

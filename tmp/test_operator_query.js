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

async function testOperatorQuery() {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            DECLARE @FromDate DATE = '2026-02-01';
            DECLARE @ToDate DATE = '2026-02-18';
            WITH OperatorEquipmentData AS (
                SELECT 
                    'Loading' AS Type,
                    CONCAT(O.OperatorName, ' (', O.OperatorId, ')') AS OperatorName,
                    E.EquipmentName AS Equipment,
                    E.Model,
                    E.Capacity,
                    L.LoadingDate,
                    L.ShiftId,
                    SUM(L.NoofTrip) AS Trip,
                    SUM(CASE 
                        WHEN Mt.MaterialName IN ('ROM COAL', 'CRUSHED COAL') THEN L.TotalQty / 1.55 
                        WHEN Mt.MaterialName IN ('OB', 'OVER BURDEN') THEN L.TotalQty 
                        ELSE 0 
                    END) AS Qty,
                    MAX(ER.TotalWorkingHr) AS Hrs
                FROM Trans.TblLoading L WITH(NOLOCK)
                JOIN Trans.TblEquipmentReading ER WITH(NOLOCK) 
                    ON L.LoadingMachineEquipmentId = ER.EquipmentId 
                    AND L.LoadingDate = ER.Date 
                    AND L.ShiftId = ER.ShiftId
                    AND ER.ActivityId = 3 
                JOIN Master.TblOperator O WITH(NOLOCK) ON ER.OperatorId = O.SlNo
                JOIN Master.TblEquipment E WITH(NOLOCK) ON L.LoadingMachineEquipmentId = E.SlNo
                LEFT JOIN Master.TblMaterial Mt WITH(NOLOCK) ON L.MaterialId = Mt.SlNo
                WHERE L.IsDelete = 0 
                  AND L.LoadingDate BETWEEN @FromDate AND @ToDate
                GROUP BY O.OperatorName, O.OperatorId, E.EquipmentName, E.Model, E.Capacity, L.LoadingDate, L.ShiftId
            )
            SELECT TOP 5
                Type,
                OperatorName,
                Equipment,
                Model,
                Capacity,
                SUM(Trip) AS Trip,
                ROUND(SUM(Qty), 0) AS Qty,
                ROUND(SUM(Hrs), 2) AS Hrs,
                ROUND(CASE WHEN SUM(Hrs) > 0 THEN SUM(Trip) / SUM(Hrs) ELSE 0 END, 0) AS TripsPerHr,
                ROUND(CASE WHEN SUM(Hrs) > 0 THEN SUM(Qty) / SUM(Hrs) ELSE 0 END, 0) AS BCMPerHr
            FROM OperatorEquipmentData
            GROUP BY OperatorName, Equipment, Model, Capacity, Type
            ORDER BY Qty DESC
        `);
        console.table(result.recordset);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

testOperatorQuery();

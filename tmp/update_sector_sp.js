
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

async function updateSP() {
    try {
        console.log(`Connecting to database: ${config.database} on ${config.server}`);
        const pool = await new sql.ConnectionPool(config).connect();

        const alterSP = `
ALTER PROCEDURE [dbo].[ProMS2_SPReportSectorWiseProduction]
    @Date DATE,
    @ShiftId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    -- CTE: Aggregate Loading first (Production)
    -- Grouped by Eq, Shift, Date to match Reading granularity
    WITH CTE_Loading AS (
        SELECT
            L.LoadingMachineEquipmentId,
            L.ShiftId,
            Cast(L.LoadingDate as Date) as LDate,
            SUM(L.NoofTrip) as Trips,
            SUM(L.TotalQty) as Qty,
            L.MaterialId
        FROM [Trans].[TblLoading] L
        JOIN [Master].[TblMaterial] M ON L.MaterialId = M.SlNo
        WHERE L.IsDelete = 0
          AND Cast(L.LoadingDate as Date) = @Date
          AND (@ShiftId IS NULL OR L.ShiftId = @ShiftId) -- Filter by Shift
          AND M.MaterialName IN ('TOP SOIL', 'OVER BURDEN', 'INTER BURDEN', 'OB', 'TS', 'IB')
        GROUP BY L.LoadingMachineEquipmentId, L.ShiftId, Cast(L.LoadingDate as Date), L.MaterialId
    ),
    -- Consolidate Loading (in case multiple OB materials for same shift/eq)
    CTE_Loading_Agg AS (
        SELECT
            LoadingMachineEquipmentId, ShiftId, LDate,
            SUM(Trips) as TotalTrips,
            SUM(Qty) as TotalQty
        FROM CTE_Loading
        GROUP BY LoadingMachineEquipmentId, ShiftId, LDate
    )
    SELECT
        -- Grouping Keys
        ISNULL(sec.SectorName, 'Unknown Sector') as SectorName,
        Eq.EquipmentName,
        pa.Name as PatchName,
        me.Name as MethodName,
        -- Metrics
        SUM(ISNULL(LA.TotalTrips, 0)) as Trips,
        SUM(ISNULL(LA.TotalQty, 0)) as QtyBCM,
        SUM(ISNULL(R.TotalWorkingHr, 0)) as OBHrs,

        -- Derived
        0 as TargetBCMHr,
        CASE WHEN SUM(ISNULL(R.TotalWorkingHr, 0)) > 0
             THEN SUM(ISNULL(LA.TotalQty, 0)) / SUM(ISNULL(R.TotalWorkingHr, 0))
             ELSE 0
        END as BCMHr
    FROM [Trans].[TblEquipmentReading] R

    -- Join Masters for R
    LEFT JOIN [Master].[TblEquipment] Eq ON R.EquipmentId = Eq.SlNo
    LEFT JOIN [Master].[TblSector] sec ON R.SectorId = sec.SlNo
    LEFT JOIN [Master].[TblPatch] pa ON R.PatchId = pa.SlNo
    LEFT JOIN [Master].[TblMethod] me ON R.MethodId = me.SlNo
    
    -- Join Loading Agg
    RIGHT JOIN CTE_Loading_Agg LA ON LA.LoadingMachineEquipmentId = R.EquipmentId
                                  AND LA.ShiftId = R.ShiftId
                                  AND LA.LDate = Cast(R.[Date] as Date)
    WHERE R.IsDelete = 0
      AND Cast(R.[Date] as Date) = @Date
      AND (@ShiftId IS NULL OR R.ShiftId = @ShiftId) -- Filter by Shift

    GROUP BY sec.SectorName, Eq.EquipmentName, pa.Name, me.Name

    ORDER BY sec.SectorName, Eq.EquipmentName;
END
        `;

        console.log("--- Executing ALTER PROCEDURE ---");
        await pool.request().query(alterSP);
        console.log("Stored Procedure updated successfully.");

        await pool.close();

    } catch (error) {
        console.error('Error executing query:', error);
    }
}

updateSP();

const fs = require('fs');

const spDefinition = `
CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Sp_EquipmentPerformanceReport]
    @Date DATE,
    @ActivityIds NVARCHAR(MAX) = NULL,
    @EquipmentIds NVARCHAR(MAX) = NULL,
    @OperatorIds NVARCHAR(MAX) = NULL 
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @StartOfMonth DATE = DATEFROMPARTS(YEAR(@Date), MONTH(@Date), 1);
    DECLARE @StartOfYear DATE = DATEFROMPARTS(YEAR(@Date), 1, 1);

    DECLARE @ActivityTbl TABLE (Id INT);
    IF @ActivityIds IS NOT NULL AND @ActivityIds <> ''
        INSERT INTO @ActivityTbl SELECT value FROM STRING_SPLIT(@ActivityIds, ',');

    DECLARE @EquipmentTbl TABLE (Id INT);
    IF @EquipmentIds IS NOT NULL AND @EquipmentIds <> ''
        INSERT INTO @EquipmentTbl SELECT value FROM STRING_SPLIT(@EquipmentIds, ',');

    DECLARE @OperatorTbl TABLE (Id INT);
    IF @OperatorIds IS NOT NULL AND @OperatorIds <> ''
        INSERT INTO @OperatorTbl SELECT value FROM STRING_SPLIT(@OperatorIds, ',');

    -- 1. Reading CTE
    WITH ReadingCTE AS (
        SELECT 
            ER.EquipmentId,
            ER.ShiftId,
            CAST(ER.Date AS DATE) AS WorkDate,
            SUM(ER.TotalWorkingHr) AS WorkingHr,
            SUM(ISNULL(ER.NetKMR, 0)) AS Kms,
            0 AS Fuel,
            STRING_AGG(CONCAT(OP.OperatorName, '(', OP.OperatorId, ')'), ', ') WITHIN GROUP (ORDER BY OP.OperatorName) AS OperatorNames,
            STRING_AGG(CAST(OP.SlNo AS VARCHAR), ',') AS OperatorSlNos
        FROM Trans.TblEquipmentReading ER WITH(NOLOCK)
        LEFT JOIN Master.TblOperator OP WITH(NOLOCK) ON ER.OperatorId = OP.SlNo
        WHERE ER.IsDelete = 0 
          AND ER.Date >= @StartOfMonth
          AND CAST(ER.Date AS DATE) <= @Date
          AND (@OperatorIds IS NULL OR OP.SlNo IN (SELECT Id FROM @OperatorTbl)) 
        GROUP BY ER.EquipmentId, ER.ShiftId, CAST(ER.Date AS DATE)
    ),

    -- 2. Loading CTE
    LoadingCTE AS (
        SELECT 
            L.LoadingMachineEquipmentId AS EquipmentId,
            L.ShiftId,
            CAST(L.LoadingDate AS DATE) AS WorkDate,
            SUM(L.NoofTrip) AS Trips,
            SUM(CASE WHEN M.MaterialName LIKE '%COAL%' THEN (L.TotalQty / 1.55) ELSE L.TotalQty END) AS Qty
        FROM Trans.TblLoading L WITH(NOLOCK)
        LEFT JOIN Master.TblMaterial M WITH(NOLOCK) ON L.MaterialId = M.SlNo
        WHERE L.IsDelete = 0 
          AND L.LoadingDate >= @StartOfMonth
          AND CAST(L.LoadingDate AS DATE) <= @Date
        GROUP BY L.LoadingMachineEquipmentId, L.ShiftId, CAST(L.LoadingDate AS DATE)

        UNION ALL

        SELECT 
            L.HaulerEquipmentId AS EquipmentId,
            L.ShiftId,
            CAST(L.LoadingDate AS DATE) AS WorkDate,
            SUM(L.NoofTrip) AS Trips,
            SUM(CASE WHEN M.MaterialName LIKE '%COAL%' THEN (L.TotalQty / 1.55) ELSE L.TotalQty END) AS Qty
        FROM Trans.TblLoading L WITH(NOLOCK)
        LEFT JOIN Master.TblMaterial M WITH(NOLOCK) ON L.MaterialId = M.SlNo
        WHERE L.IsDelete = 0 
          AND L.LoadingDate >= @StartOfMonth
          AND CAST(L.LoadingDate AS DATE) <= @Date
          AND L.HaulerEquipmentId IS NOT NULL
        GROUP BY L.HaulerEquipmentId, L.ShiftId, CAST(L.LoadingDate AS DATE)
    ),

    MergedLoading AS (
        SELECT EquipmentId, ShiftId, WorkDate, SUM(Trips) AS Trips, SUM(Qty) AS Qty
        FROM LoadingCTE
        GROUP BY EquipmentId, ShiftId, WorkDate
    ),

    -- 3. Combined Data
    CombinedData AS (
        SELECT 
            COALESCE(R.EquipmentId, L.EquipmentId) AS EquipmentId,
            COALESCE(R.ShiftId, L.ShiftId) AS ShiftId,
            COALESCE(R.WorkDate, L.WorkDate) AS WorkDate,
            ISNULL(R.WorkingHr, 0) AS WorkingHr,
            ISNULL(R.Fuel, 0) AS Fuel,
            ISNULL(R.Kms, 0) AS Kms,
            ISNULL(L.Trips, 0) AS Trips,
            ISNULL(L.Qty, 0) AS Qty,
            R.OperatorNames 
        FROM ReadingCTE R
        FULL OUTER JOIN MergedLoading L 
            ON R.EquipmentId = L.EquipmentId 
            AND R.ShiftId = L.ShiftId 
            AND R.WorkDate = L.WorkDate
    )

    -- 4. Final Aggregation (CAST TO INT for Trips/Qty)
    SELECT 
        ROW_NUMBER() OVER(ORDER BY AC.Name, E.EquipmentName) AS SlNo,
        FORMAT(E.SlNo, '2000000') AS [PMS Code],
        E.CostCenter,
        E.EquipmentName AS Equipment,
        
        STRING_AGG(CASE WHEN C.WorkDate = @Date THEN C.OperatorNames ELSE NULL END, ', ') WITHIN GROUP (ORDER BY C.ShiftId) AS Operator,

        AC.Name AS Activity,
        AC.SlNo AS ActivityId,

        -- Shift A
        CAST(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.Trips ELSE 0 END) AS INT) AS [Shift ATotal Trips],
        CAST(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.Qty ELSE 0 END) AS DECIMAL(18,2)) AS [Shift ATotal Qty],
        CAST(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.WorkingHr ELSE 0 END) AS DECIMAL(18,2)) AS [Shift ATotal Hrs],
        CAST(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.Kms ELSE 0 END)  AS DECIMAL(18,2)) AS [Shift ATotal Kms],
        
        CASE WHEN SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.WorkingHr ELSE 0 END) > 0 
             THEN CAST(ROUND(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.Trips ELSE 0 END) / SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.WorkingHr ELSE 0 END), 0) AS INT)
             ELSE 0 END AS [Shift ATrips Per Hr],
             
        CASE WHEN SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.WorkingHr ELSE 0 END) > 0 
             THEN CAST(ROUND(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.Qty ELSE 0 END) / SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.WorkingHr ELSE 0 END), 0) AS INT)
             ELSE 0 END AS [Shift AQty Per Hr],


        -- Shift B
        CAST(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.Trips ELSE 0 END) AS INT) AS [Shift BTotal Trips],
        CAST(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.Qty ELSE 0 END) AS DECIMAL(18,2)) AS [Shift BTotal Qty],
        CAST(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.WorkingHr ELSE 0 END) AS DECIMAL(18,2)) AS [Shift BTotal Hrs],
        CAST(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.Kms ELSE 0 END) AS DECIMAL(18,2)) AS [Shift BTotal Kms],
        
        CASE WHEN SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.WorkingHr ELSE 0 END) > 0 
             THEN CAST(ROUND(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.Trips ELSE 0 END) / SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.WorkingHr ELSE 0 END), 0) AS INT)
             ELSE 0 END AS [Shift BTrips Per Hr],
             
        CASE WHEN SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.WorkingHr ELSE 0 END) > 0 
             THEN CAST(ROUND(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.Qty ELSE 0 END) / SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.WorkingHr ELSE 0 END), 0) AS INT)
             ELSE 0 END AS [Shift BQty Per Hr],


        -- Shift C
        CAST(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.Trips ELSE 0 END) AS INT) AS [Shift CTotal Trips],
        CAST(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.Qty ELSE 0 END) AS DECIMAL(18,2)) AS [Shift CTotal Qty],
        CAST(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.WorkingHr ELSE 0 END) AS DECIMAL(18,2)) AS [Shift CTotal Hrs],
        CAST(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.Kms ELSE 0 END) AS DECIMAL(18,2)) AS [Shift CTotal Kms],
        
        CASE WHEN SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.WorkingHr ELSE 0 END) > 0 
             THEN CAST(ROUND(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.Trips ELSE 0 END) / SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.WorkingHr ELSE 0 END), 0) AS INT)
             ELSE 0 END AS [Shift CTrips Per Hr],
             
        CASE WHEN SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.WorkingHr ELSE 0 END) > 0 
             THEN CAST(ROUND(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.Qty ELSE 0 END) / SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.WorkingHr ELSE 0 END), 0) AS INT)
             ELSE 0 END AS [Shift CQty Per Hr],


        -- FTD (For The Day)
        CAST(SUM(CASE WHEN C.WorkDate = @Date THEN C.Trips ELSE 0 END) AS INT) AS [FTDTotal Trips],
        CAST(SUM(CASE WHEN C.WorkDate = @Date THEN C.Qty ELSE 0 END) AS DECIMAL(18,2)) AS [FTDTotal Qty],
        CAST(SUM(CASE WHEN C.WorkDate = @Date THEN C.WorkingHr ELSE 0 END) AS DECIMAL(18,2)) AS [FTDTotal Hrs],
        CAST(SUM(CASE WHEN C.WorkDate = @Date THEN C.Kms ELSE 0 END) AS DECIMAL(18,2)) AS [FTDTotal Kms],
        CAST(SUM(CASE WHEN C.WorkDate = @Date THEN C.Fuel ELSE 0 END) AS DECIMAL(18,2)) AS [FTDTotal Fuel],
        
        -- Calculated Fields
        CASE WHEN SUM(CASE WHEN C.WorkDate = @Date THEN C.WorkingHr ELSE 0 END) > 0 
             THEN CAST(ROUND(SUM(CASE WHEN C.WorkDate = @Date THEN C.Trips ELSE 0 END) / SUM(CASE WHEN C.WorkDate = @Date THEN C.WorkingHr ELSE 0 END), 0) AS INT)
             ELSE 0 END AS [FTDTrips Per Hr],
        CASE WHEN SUM(CASE WHEN C.WorkDate = @Date THEN C.WorkingHr ELSE 0 END) > 0 
             THEN CAST(ROUND(SUM(CASE WHEN C.WorkDate = @Date THEN C.Qty ELSE 0 END) / SUM(CASE WHEN C.WorkDate = @Date THEN C.WorkingHr ELSE 0 END), 0) AS INT)
             ELSE 0 END AS [FTDQty Per Hr],
        
        CASE WHEN SUM(CASE WHEN C.WorkDate = @Date THEN C.WorkingHr ELSE 0 END) > 0 
             THEN SUM(CASE WHEN C.WorkDate = @Date THEN C.Fuel ELSE 0 END) / SUM(CASE WHEN C.WorkDate = @Date THEN C.WorkingHr ELSE 0 END)
             ELSE 0 END AS [FTDFuel Per Hr],
        0 AS [FTDKMPL],

        -- MTD (Month Upto Date)
        CAST(SUM(C.Trips) AS INT) AS [MTDTotal Trips],
        CAST(SUM(C.Qty) AS DECIMAL(18,2)) AS [MTDTotal Qty],
        CAST(SUM(C.WorkingHr) AS DECIMAL(18,2)) AS [MTDTotal Hrs],
        CAST(SUM(C.Kms) AS DECIMAL(18,2)) AS [MTDTotal Kms],
        CAST(SUM(C.Fuel) AS DECIMAL(18,2)) AS [MTDTotal Fuel],

        CASE WHEN SUM(C.WorkingHr) > 0 THEN CAST(ROUND(SUM(C.Trips) / SUM(C.WorkingHr), 0) AS INT) ELSE 0 END AS [MTDTrips Per Hr],
        CASE WHEN SUM(C.WorkingHr) > 0 THEN CAST(ROUND(SUM(C.Qty) / SUM(C.WorkingHr), 0) AS INT) ELSE 0 END AS [MTDQty Per Hr],
        CASE WHEN SUM(C.WorkingHr) > 0 THEN SUM(C.Fuel) / SUM(C.WorkingHr) ELSE 0 END AS [MTDFuel Per Hr],
        0 AS [MTDKMPL]

    FROM CombinedData C
    JOIN Master.TblEquipment E WITH(NOLOCK) ON C.EquipmentId = E.SlNo
    LEFT JOIN Master.TblActivity AC WITH(NOLOCK) ON E.ActivityId = AC.SlNo
    LEFT JOIN Master.TblShift S WITH(NOLOCK) ON C.ShiftId = S.SlNo
    WHERE 
        E.IsDelete = 0
        AND (@ActivityIds IS NULL OR AC.SlNo IN (SELECT Id FROM @ActivityTbl))
        AND (@EquipmentIds IS NULL OR E.SlNo IN (SELECT Id FROM @EquipmentTbl))
        AND (@OperatorIds IS NULL OR EXISTS (SELECT 1 FROM @OperatorTbl)) 
        
    GROUP BY E.SlNo, E.SlNo, E.CostCenter, E.EquipmentName, AC.Name, AC.SlNo
    ORDER BY AC.Name, E.EquipmentName;

END
`;

fs.writeFileSync('f:/Dev/ProMS/ProMSDev/tmp/update_equipment_perf_sp.sql', spDefinition);

const sqlCmd = `
const sql = require('mssql');
const fs = require('fs');

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

async function execute() {
    try {
        const pool = await sql.connect(config);
        const query = fs.readFileSync('f:/Dev/ProMS/ProMSDev/tmp/update_equipment_perf_sp.sql', 'utf8');
        await pool.request().batch(query);
        console.log("SP Updated Successfully!");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
execute();
`;

fs.writeFileSync('f:/Dev/ProMS/ProMSDev/tmp/run_update_sp.js', sqlCmd);

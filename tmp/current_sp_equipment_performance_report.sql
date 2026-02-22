CREATE   PROCEDURE [dbo].[PMS2_New_Sp_EquipmentPerformanceReport]
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
            SUM(L.TotalQty) AS Qty
        FROM Trans.TblLoading L WITH(NOLOCK)
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
            SUM(L.TotalQty) AS Qty
        FROM Trans.TblLoading L WITH(NOLOCK)
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

        -- Shift A (Cast results to INT to remove decimals)
        CAST(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.Trips ELSE 0 END) AS INT) AS [Shift ATotal Trips],
        CAST(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.Qty ELSE 0 END) AS DECIMAL(18,0)) AS [Shift ATotal Qty], -- Use Decimal(18,0) for Qty to be safe but integer-like
        SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.WorkingHr ELSE 0 END) AS [Shift ATotal Hrs],
        SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.Kms ELSE 0 END) AS [Shift ATotal Kms],
        
        -- Shift A Calculations (Rounded to Whole Number)
        CASE WHEN SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.WorkingHr ELSE 0 END) > 0 
             THEN CAST(ROUND(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.Trips ELSE 0 END) / SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.WorkingHr ELSE 0 END), 0) AS INT)
             ELSE 0 END AS [Shift ATrips Per Hr],
             
        CASE WHEN SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.WorkingHr ELSE 0 END) > 0 
             THEN CAST(ROUND(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.Qty ELSE 0 END) / SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.WorkingHr ELSE 0 END), 0) AS INT)
             ELSE 0 END AS [Shift AQty Per Hr],

        -- Shift B
        CAST(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.Trips ELSE 0 END) AS INT) AS [Shift BTotal Trips],
        CAST(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.Qty ELSE 0 END) AS DECIMAL(18,0)) AS [Shift BTotal Qty],
        SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.WorkingHr ELSE 0 END) AS [Shift BTotal Hrs],
        SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.Kms ELSE 0 END) AS [Shift BTotal Kms],
        
        -- Shift B Calculations
        CASE WHEN SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.WorkingHr ELSE 0 END) > 0 
             THEN CAST(ROUND(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.Trips ELSE 0 END) / SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.WorkingHr ELSE 0 END), 0) AS INT)
             ELSE 0 END AS [Shift BTrips Per Hr],
             
        CASE WHEN SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.WorkingHr ELSE 0 END) > 0 
             THEN CAST(ROUND(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.Qty ELSE 0 END) / SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.WorkingHr ELSE 0 END), 0) AS INT)
             ELSE 0 END AS [Shift BQty Per Hr],

        -- Shift C
        CAST(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.Trips ELSE 0 END) AS INT) AS [Shift CTotal Trips],
        CAST(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.Qty ELSE 0 END) AS DECIMAL(18,0)) AS [Shift CTotal Qty],
        SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.WorkingHr ELSE 0 END) AS [Shift CTotal Hrs],
        SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.Kms ELSE 0 END) AS [Shift CTotal Kms],
        
        -- Shift C Calculations
        CASE WHEN SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.WorkingHr ELSE 0 END) > 0 
             THEN CAST(ROUND(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.Trips ELSE 0 END) / SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.WorkingHr ELSE 0 END), 0) AS INT)
             ELSE 0 END AS [Shift CTrips Per Hr],
             
        CASE WHEN SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.WorkingHr ELSE 0 END) > 0 
             THEN CAST(ROUND(SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.Qty ELSE 0 END) / SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.WorkingHr ELSE 0 END), 0) AS INT)
             ELSE 0 END AS [Shift CQty Per Hr],

        -- FTD (For The Day)
        CAST(SUM(CASE WHEN C.WorkDate = @Date THEN C.Trips ELSE 0 END) AS INT) AS [FTDTotal Trips],
        CAST(SUM(CASE WHEN C.WorkDate = @Date THEN C.Qty ELSE 0 END) AS DECIMAL(18,0)) AS [FTDTotal Qty],
        SUM(CASE WHEN C.WorkDate = @Date THEN C.WorkingHr ELSE 0 END) AS [FTDTotal Hrs],
        SUM(CASE WHEN C.WorkDate = @Date THEN C.Kms ELSE 0 END) AS [FTDTotal Kms],
        SUM(CASE WHEN C.WorkDate = @Date THEN C.Fuel ELSE 0 END) AS [FTDTotal Fuel],
        
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
        CAST(SUM(C.Qty) AS DECIMAL(18,0)) AS [MTDTotal Qty],
        SUM(C.WorkingHr) AS [MTDTotal Hrs],
        SUM(C.Kms) AS [MTDTotal Kms],
        SUM(C.Fuel) AS [MTDTotal Fuel],

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

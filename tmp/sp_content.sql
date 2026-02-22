
CREATE   PROCEDURE [dbo].[PMS2_New_Sp_EquipmentPerformanceReport]
    @Date DATE,
    @ActivityIds NVARCHAR(MAX) = NULL,
    @EquipmentIds NVARCHAR(MAX) = NULL,
    @OperatorIds NVARCHAR(MAX) = NULL -- Added Operator Filter
AS
BEGIN
    SET NOCOUNT ON;

    -- =============================================
    -- Variable Declarations
    -- =============================================
    DECLARE @StartOfMonth DATE = DATEFROMPARTS(YEAR(@Date), MONTH(@Date), 1);
    DECLARE @StartOfYear DATE = DATEFROMPARTS(YEAR(@Date), 1, 1);

    -- Filters
    DECLARE @ActivityTbl TABLE (Id INT);
    IF @ActivityIds IS NOT NULL AND @ActivityIds <> ''
        INSERT INTO @ActivityTbl SELECT value FROM STRING_SPLIT(@ActivityIds, ',');

    DECLARE @EquipmentTbl TABLE (Id INT);
    IF @EquipmentIds IS NOT NULL AND @EquipmentIds <> ''
        INSERT INTO @EquipmentTbl SELECT value FROM STRING_SPLIT(@EquipmentIds, ',');

    DECLARE @OperatorTbl TABLE (Id INT);
    IF @OperatorIds IS NOT NULL AND @OperatorIds <> ''
        INSERT INTO @OperatorTbl SELECT value FROM STRING_SPLIT(@OperatorIds, ',');

    -- =============================================
    -- 1. Aggregate Working Hours & Kms (From EquipmentReading)
    -- =============================================
    WITH ReadingCTE AS (
        SELECT 
            ER.EquipmentId,
            ER.ShiftId,
            CAST(ER.Date AS DATE) AS WorkDate,
            SUM(ER.TotalWorkingHr) AS WorkingHr,
            SUM(ISNULL(ER.NetKMR, 0)) AS Kms,
            0 AS Fuel,
            -- Get Distinct Operator Names with ID for this shift/equipment
            -- Format: Name(ID)
            STRING_AGG(CONCAT(OP.OperatorName, '(', OP.OperatorId, ')'), ', ') WITHIN GROUP (ORDER BY OP.OperatorName) AS OperatorNames,
            -- Store Operator SlNos for Filtering
            STRING_AGG(CAST(OP.SlNo AS VARCHAR), ',') AS OperatorSlNos
        FROM Trans.TblEquipmentReading ER WITH(NOLOCK)
        LEFT JOIN Master.TblOperator OP WITH(NOLOCK) ON ER.OperatorId = OP.SlNo
        WHERE ER.IsDelete = 0 
          AND ER.Date >= @StartOfMonth
          AND CAST(ER.Date AS DATE) <= @Date
          -- Basic Optimization: If filtered by operator, only fetch reading for those operators?
          -- BUT reading is aggregated by Equipment/Shift. If multiple operators, filtering one might exclude the equipment's stats?
          -- Report usually shows Equipment stats. If filtering by Operator, likely want to show Equipments operated by that person.
          -- We will filter at the final step or here.
          -- If we filter here, we only get stats for that operator.
          AND (@OperatorIds IS NULL OR OP.SlNo IN (SELECT Id FROM @OperatorTbl)) 
        GROUP BY ER.EquipmentId, ER.ShiftId, CAST(ER.Date AS DATE)
    ),

    -- =============================================
    -- 2. Aggregate Production (Trips/Qty from Loading)
    -- =============================================
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

    -- =============================================
    -- 3. Combined Data
    -- =============================================
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
            -- Note: If filtered by operator, ReadingCTE will be empty for non-matching.
            -- LoadingCTE doesn't have operator info directly here (it's in Reading or separate).
            -- So if filtering by Operator, we rely on ReadingCTE to filter.
    )

    -- =============================================
    -- 4. Final Aggregation & Pivot
    -- =============================================
    SELECT 
        ROW_NUMBER() OVER(ORDER BY AC.Name, E.EquipmentName) AS SlNo,
        FORMAT(E.SlNo, '2000000') AS [PMS Code],
        E.CostCenter,
        E.EquipmentName AS Equipment,
        
        -- Operator Name (Aggregated)
        STRING_AGG(CASE WHEN C.WorkDate = @Date THEN C.OperatorNames ELSE NULL END, ', ') WITHIN GROUP (ORDER BY C.ShiftId) AS Operator,

        AC.Name AS Activity,
        AC.SlNo AS ActivityId,

        -- Shift A
        SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.Trips ELSE 0 END) AS [Shift ATotal Trips],
        SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.Qty ELSE 0 END) AS [Shift ATotal Qty],
        SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.WorkingHr ELSE 0 END) AS [Shift ATotal Hrs],
        SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%A%' THEN C.Kms ELSE 0 END) AS [Shift ATotal Kms],
        0 AS [Shift ATrips Per Hr], 0 AS [Shift AQty Per Hr],

        -- Shift B
        SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.Trips ELSE 0 END) AS [Shift BTotal Trips],
        SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.Qty ELSE 0 END) AS [Shift BTotal Qty],
        SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.WorkingHr ELSE 0 END) AS [Shift BTotal Hrs],
        SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%B%' THEN C.Kms ELSE 0 END) AS [Shift BTotal Kms],
        0 AS [Shift BTrips Per Hr], 0 AS [Shift BQty Per Hr],

        -- Shift C
        SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.Trips ELSE 0 END) AS [Shift CTotal Trips],
        SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.Qty ELSE 0 END) AS [Shift CTotal Qty],
        SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.WorkingHr ELSE 0 END) AS [Shift CTotal Hrs],
        SUM(CASE WHEN C.WorkDate = @Date AND S.ShiftName LIKE '%C%' THEN C.Kms ELSE 0 END) AS [Shift CTotal Kms],
        0 AS [Shift CTrips Per Hr], 0 AS [Shift CQty Per Hr],

        -- FTD (For The Day)
        SUM(CASE WHEN C.WorkDate = @Date THEN C.Trips ELSE 0 END) AS [FTDTotal Trips],
        SUM(CASE WHEN C.WorkDate = @Date THEN C.Qty ELSE 0 END) AS [FTDTotal Qty],
        SUM(CASE WHEN C.WorkDate = @Date THEN C.WorkingHr ELSE 0 END) AS [FTDTotal Hrs],
        SUM(CASE WHEN C.WorkDate = @Date THEN C.Kms ELSE 0 END) AS [FTDTotal Kms],
        SUM(CASE WHEN C.WorkDate = @Date THEN C.Fuel ELSE 0 END) AS [FTDTotal Fuel],
        
        -- Calculated Fields
        CASE WHEN SUM(CASE WHEN C.WorkDate = @Date THEN C.WorkingHr ELSE 0 END) > 0 
             THEN SUM(CASE WHEN C.WorkDate = @Date THEN C.Trips ELSE 0 END) / SUM(CASE WHEN C.WorkDate = @Date THEN C.WorkingHr ELSE 0 END)
             ELSE 0 END AS [FTDTrips Per Hr],
        CASE WHEN SUM(CASE WHEN C.WorkDate = @Date THEN C.WorkingHr ELSE 0 END) > 0 
             THEN SUM(CASE WHEN C.WorkDate = @Date THEN C.Qty ELSE 0 END) / SUM(CASE WHEN C.WorkDate = @Date THEN C.WorkingHr ELSE 0 END)
             ELSE 0 END AS [FTDQty Per Hr],
        CASE WHEN SUM(CASE WHEN C.WorkDate = @Date THEN C.WorkingHr ELSE 0 END) > 0 
             THEN SUM(CASE WHEN C.WorkDate = @Date THEN C.Fuel ELSE 0 END) / SUM(CASE WHEN C.WorkDate = @Date THEN C.WorkingHr ELSE 0 END)
             ELSE 0 END AS [FTDFuel Per Hr],
        0 AS [FTDKMPL],

        -- MTD (Month Upto Date)
        SUM(C.Trips) AS [MTDTotal Trips],
        SUM(C.Qty) AS [MTDTotal Qty],
        SUM(C.WorkingHr) AS [MTDTotal Hrs],
        SUM(C.Kms) AS [MTDTotal Kms],
        SUM(C.Fuel) AS [MTDTotal Fuel],

        CASE WHEN SUM(C.WorkingHr) > 0 THEN SUM(C.Trips) / SUM(C.WorkingHr) ELSE 0 END AS [MTDTrips Per Hr],
        CASE WHEN SUM(C.WorkingHr) > 0 THEN SUM(C.Qty) / SUM(C.WorkingHr) ELSE 0 END AS [MTDQty Per Hr],
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
        -- If Operator Filter is applied, we must ensure the row corresponds to that operator (via ReadingCTE)
        AND (@OperatorIds IS NULL OR EXISTS (SELECT 1 FROM @OperatorTbl)) -- Logic handled in ReadingCTE inner join/where
        -- Actually, if we filter in ReadingCTE, CombinedData will only have matching rows.
        -- But MergedLoading brings data too. If we only filter Reading, we might show loading data without reading?
        -- Yes, but Equipment Performance is primarily driven by Reading (Hours).
        -- If filter applied, we typically want to see performance WHERE that operator worked.
        
    GROUP BY E.SlNo, E.SlNo, E.CostCenter, E.EquipmentName, AC.Name, AC.SlNo
    ORDER BY AC.Name, E.EquipmentName;

END


CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Dash_SP_GetAnalyticalStats]
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Date Components
    DECLARE @StartOfMonth DATE = DATEFROMPARTS(YEAR(@ToDate), MONTH(@ToDate), 1);
    DECLARE @StartOfYear DATE = DATEFROMPARTS(YEAR(@ToDate), 4, 1); -- Financial Year starts April 1st? Or Jan 1st?
    -- Assuming Input Date is financial year agnostic for now, or using Jan 1. 
    -- User context is Mining, usually April 1st in India. But simple Jan 1st is safer unless specified.
    -- Let's stick to Standard Year (Jan 1) for simplicity unless requested.
    SET @StartOfYear = DATEFROMPARTS(YEAR(@ToDate), 1, 1);
    
    DECLARE @DayOfMonth INT = DAY(@ToDate);
    IF @DayOfMonth = 0 SET @DayOfMonth = 1;

    -- =============================================
    -- 1. KPIs & Details Preparation
    -- =============================================

    -- COAL PRODUCTION (MT) -> MaterialId = 7 (ROM Coal)
    -- OB REMOVAL (BCM) -> MaterialId IN (1, 2) (TopSoil, OB)
    -- CRUSHING (MT) -> TblCrusher
    -- DISPATCH (MT) -> TblDispatchEntry
    -- COAL REHANDLING -> TblMaterialRehandling (MaterialId = 7)
    -- OB REHANDLING -> TblMaterialRehandling (MaterialId = 5) -- Assuming 5 is OB Rehandling based on previous SPs

    CREATE TABLE #Stats (
        SectionId VARCHAR(50),
        Category VARCHAR(100),
        Date DATE,
        Qty DECIMAL(18,2)
    );

    -- Insert Coal Prod
    INSERT INTO #Stats (SectionId, Category, Date, Qty)
    SELECT 'coal_prod', ISNULL(S.Name, 'Unknown'), CAST(L.LoadingDate AS DATE), L.TotalQty
    FROM Trans.TblLoading L WITH(NOLOCK)
    LEFT JOIN Master.TblSource S WITH(NOLOCK) ON L.SourceId = S.SlNo
    WHERE L.IsDelete = 0 AND L.MaterialId = 7 AND CAST(L.LoadingDate AS DATE) <= @ToDate AND YEAR(L.LoadingDate) = YEAR(@ToDate);

    -- Insert OB Removal
    INSERT INTO #Stats (SectionId, Category, Date, Qty)
    SELECT 'ob_rem', ISNULL(P.Name, 'Unknown'), CAST(L.LoadingDate AS DATE), L.TotalQty
    FROM Trans.TblLoading L WITH(NOLOCK)
    LEFT JOIN Master.TblPatch P WITH(NOLOCK) ON L.PatchId = P.SlNo -- Check if PatchId exists in Loading? 
    -- Wait, Loading table doesn't have PatchId directly usually, it's in Reading or inferred. 
    -- Previous SP used Reading to get Patch. 
    -- TblLoading has SourceId. Let's use SourceId for now or TblEquipmentReading link if strictly needed.
    -- For dashboard speed, SourceId is better if available. L.SourceId maps to TblSource? 
    -- Let's check TblLoading columns again. It has SourceId.
    -- If Patch is needed, we might need a join. Let's use Source/Sector for category.
    WHERE L.IsDelete = 0 AND L.MaterialId IN (1, 2) AND CAST(L.LoadingDate AS DATE) <= @ToDate AND YEAR(L.LoadingDate) = YEAR(@ToDate);

    -- Insert Crushing
    INSERT INTO #Stats (SectionId, Category, Date, Qty)
    SELECT 'crushing', 'Plant ' + CAST(ISNULL(C.PlantId, 0) AS VARCHAR), CAST(C.Date AS DATE), C.ProductionQty
    FROM Trans.TblCrusher C WITH(NOLOCK)
    WHERE C.IsDelete = 0 AND CAST(C.Date AS DATE) <= @ToDate AND YEAR(C.Date) = YEAR(@ToDate);

    -- Insert Dispatch
    INSERT INTO #Stats (SectionId, Category, Date, Qty)
    SELECT 'dispatch', ISNULL(L.DispatchLocationName, 'Unknown'), CAST(D.Date AS DATE), D.TotalQty
    FROM Trans.TblDispatchEntry D WITH(NOLOCK)
    LEFT JOIN Master.TblDispatchLocation L WITH(NOLOCK) ON D.DispatchLocationId = L.SlNo
    WHERE D.IsDelete = 0 AND CAST(D.Date AS DATE) <= @ToDate AND YEAR(D.Date) = YEAR(@ToDate);

    -- Insert Coal Rehandling
    INSERT INTO #Stats (SectionId, Category, Date, Qty)
    SELECT 'coal_re', 'Rehandling', CAST(R.RehandlingDate AS DATE), R.TotalQty
    FROM Trans.TblMaterialRehandling R WITH(NOLOCK)
    WHERE R.IsDelete = 0 AND R.MaterialId = 7 AND CAST(R.RehandlingDate AS DATE) <= @ToDate AND YEAR(R.RehandlingDate) = YEAR(@ToDate);

    -- Insert OB Rehandling
    INSERT INTO #Stats (SectionId, Category, Date, Qty)
    SELECT 'ob_re', 'Rehandling', CAST(R.RehandlingDate AS DATE), R.TotalQty
    FROM Trans.TblMaterialRehandling R WITH(NOLOCK)
    WHERE R.IsDelete = 0 AND R.MaterialId = 5 AND CAST(R.RehandlingDate AS DATE) <= @ToDate AND YEAR(R.RehandlingDate) = YEAR(@ToDate);

    -- =============================================
    -- OUTPUT 1: KPIs
    -- =============================================
    SELECT 
        SectionId,
        SUM(CASE WHEN Date = @ToDate THEN Qty ELSE 0 END) AS FTD,
        SUM(CASE WHEN Date >= @StartOfMonth AND Date <= @ToDate THEN Qty ELSE 0 END) AS MTD,
        CAST(SUM(CASE WHEN Date >= @StartOfMonth AND Date <= @ToDate THEN Qty ELSE 0 END) / NULLIF(@DayOfMonth, 0) AS DECIMAL(18,2)) AS Avg,
        SUM(CASE WHEN Date >= @StartOfYear AND Date <= @ToDate THEN Qty ELSE 0 END) AS YTD
    FROM #Stats
    GROUP BY SectionId;

    -- =============================================
    -- OUTPUT 2: Details
    -- =============================================
    -- Detail Breakdown
    SELECT 
        SectionId,
        Category,
        SUM(CASE WHEN Date = @ToDate THEN Qty ELSE 0 END) AS FTD,
        SUM(CASE WHEN Date >= @StartOfMonth AND Date <= @ToDate THEN Qty ELSE 0 END) AS MTD,
        CAST(SUM(CASE WHEN Date >= @StartOfMonth AND Date <= @ToDate THEN Qty ELSE 0 END) / NULLIF(@DayOfMonth, 0) AS DECIMAL(18,2)) AS Avg,
        SUM(CASE WHEN Date >= @StartOfYear AND Date <= @ToDate THEN Qty ELSE 0 END) AS YTD,
        0 AS IsTotal
    FROM #Stats
    GROUP BY SectionId, Category
    UNION ALL
    -- Totals for Breakdown
    SELECT 
        SectionId,
        'Total' AS Category,
        SUM(CASE WHEN Date = @ToDate THEN Qty ELSE 0 END) AS FTD,
        SUM(CASE WHEN Date >= @StartOfMonth AND Date <= @ToDate THEN Qty ELSE 0 END) AS MTD,
        CAST(SUM(CASE WHEN Date >= @StartOfMonth AND Date <= @ToDate THEN Qty ELSE 0 END) / NULLIF(@DayOfMonth, 0) AS DECIMAL(18,2)) AS Avg,
        SUM(CASE WHEN Date >= @StartOfYear AND Date <= @ToDate THEN Qty ELSE 0 END) AS YTD,
        1 AS IsTotal
    FROM #Stats
    GROUP BY SectionId;

    -- =============================================
    -- Chart Data Prep
    -- =============================================
    -- Get Work Hours from Reading
    
    -- Function to get Productivity Stats
    -- Haulers (Group 2 usually, need to verify)
    -- Loaders (Group 1 usually, need to verify)
    -- Using TblEquipment GroupId matches.
    
    -- Chart Date Range: Uses @FromDate and @ToDate passed to SP (or MTD if range is small?)
    -- Dashboard logic usually implies "Performance for the selected period".
    -- Let's use the @FromDate and @ToDate parameters for the charts (unlike KPIs which are fixed FTD/MTD/YTD).

    -- 3. Hauling Chart
    SELECT TOP 10
        E.EquipmentName,
        CAST(SUM(ISNULL(L.NoofTrip, 0)) AS DECIMAL(18,2)) / NULLIF(SUM(ISNULL(R.TotalWorkingHr, 0)), 0) as Productivity, -- Trips/Hr
        CAST(SUM(ISNULL(R.TotalWorkingHr, 0)) AS DECIMAL(18,2)) as WorkingHours,
        'Hauling' as Type
    FROM Master.TblEquipment E WITH(NOLOCK)
    JOIN Master.TblEquipmentGroup EG WITH(NOLOCK) ON E.EquipmentGroupId = EG.SlNo AND EG.Name LIKE '%Hauler%' -- Safer text match
    LEFT JOIN Trans.TblLoading L WITH(NOLOCK) ON L.HaulerEquipmentId = E.SlNo 
               AND CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate AND L.IsDelete = 0
    LEFT JOIN Trans.TblEquipmentReading R WITH(NOLOCK) ON R.EquipmentId = E.SlNo 
               AND CAST(R.Date AS DATE) BETWEEN @FromDate AND @ToDate AND R.IsDelete = 0
    WHERE E.IsDelete = 0
    GROUP BY E.EquipmentName
    HAVING SUM(ISNULL(L.NoofTrip, 0)) > 0 OR SUM(ISNULL(R.TotalWorkingHr, 0)) > 0
    ORDER BY Productivity DESC;

    -- 4. Loading Chart
    SELECT TOP 10
        E.EquipmentName,
        CAST(SUM(ISNULL(L.TotalQty, 0)) AS DECIMAL(18,2)) / NULLIF(SUM(ISNULL(R.TotalWorkingHr, 0)), 0) as Productivity, -- BCM/Hr
        CAST(SUM(ISNULL(R.TotalWorkingHr, 0)) AS DECIMAL(18,2)) as WorkingHours,
        'Loading' as Type
    FROM Master.TblEquipment E WITH(NOLOCK)
    JOIN Master.TblEquipmentGroup EG WITH(NOLOCK) ON E.EquipmentGroupId = EG.SlNo AND (EG.Name LIKE '%Excavator%' OR EG.Name LIKE '%Loader%')
    LEFT JOIN Trans.TblLoading L WITH(NOLOCK) ON L.LoadingMachineEquipmentId = E.SlNo 
               AND CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate AND L.IsDelete = 0
    LEFT JOIN Trans.TblEquipmentReading R WITH(NOLOCK) ON R.EquipmentId = E.SlNo 
               AND CAST(R.Date AS DATE) BETWEEN @FromDate AND @ToDate AND R.IsDelete = 0
    WHERE E.IsDelete = 0
    GROUP BY E.EquipmentName
    HAVING SUM(ISNULL(L.TotalQty, 0)) > 0 OR SUM(ISNULL(R.TotalWorkingHr, 0)) > 0
    ORDER BY Productivity DESC;

    DROP TABLE #Stats;
END

CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Dash_SP_Crushing_ProductionOverview]
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Helper temp table for plants we care about
    CREATE TABLE #TargetPlants (PlantId INT, DisplayName VARCHAR(50));
    
    INSERT INTO #TargetPlants (PlantId, DisplayName)
    SELECT SlNo, 
        CASE 
            WHEN Name = 'ICP' THEN 'IPCC' 
            ELSE Name 
        END
    FROM Master.TblPlant WITH(NOLOCK)
    WHERE Name IN ('PSS-1', 'PSS-2', 'PSS-3', 'ICP', 'WP-3');

    -- 1. Shift Wise (Top 100 to allow frontend sorting/limiting)
    SELECT 
        'Shift' AS PeriodType,
        P.DisplayName AS Category, -- Using Category to match frontend logic
        C.Date,
        CASE 
            WHEN C.ShiftId = 1 THEN 'Shift A'
            WHEN C.ShiftId = 2 THEN 'Shift B'
            WHEN C.ShiftId = 3 THEN 'Shift C'
            ELSE 'Unknown'
        END AS Shift,
        SUM(C.ProductionQty) AS Qty
    FROM Trans.TblCrusher C WITH(NOLOCK)
    JOIN #TargetPlants P ON C.PlantId = P.PlantId
    WHERE C.IsDelete = 0 AND C.Date BETWEEN @FromDate AND @ToDate
    GROUP BY P.DisplayName, C.Date, C.ShiftId
    
    UNION ALL

    -- 2. Day Wise
    SELECT 
        'Day' AS PeriodType,
        P.DisplayName AS Category,
        C.Date,
        NULL AS Shift,
        SUM(C.ProductionQty) AS Qty
    FROM Trans.TblCrusher C WITH(NOLOCK)
    JOIN #TargetPlants P ON C.PlantId = P.PlantId
    WHERE C.IsDelete = 0 AND C.Date BETWEEN @FromDate AND @ToDate
    GROUP BY P.DisplayName, C.Date

    UNION ALL

    -- 3. Month Wise
    SELECT 
        'Month' AS PeriodType,
        P.DisplayName AS Category,
        NULL AS Date,
        NULL AS Shift,
        SUM(C.ProductionQty) AS Qty
    FROM Trans.TblCrusher C WITH(NOLOCK)
    JOIN #TargetPlants P ON C.PlantId = P.PlantId
    WHERE C.IsDelete = 0 AND C.Date BETWEEN @FromDate AND @ToDate
    GROUP BY P.DisplayName, FORMAT(C.Date, 'MMM-yyyy'); -- Grouping by MonthStr directly for simple display, or use Year/Month int if sorting needed. Reference used 'Month' string.

    DROP TABLE #TargetPlants;
END

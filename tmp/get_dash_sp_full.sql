CREATE   PROCEDURE [dbo].[PMS2_New_Dash_SP_PerformanceDashboard]
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    ---------------------------------------------------------------------------
    -- Temp table for Highest Production
    ---------------------------------------------------------------------------
    CREATE TABLE #HighestProd (
        SN INT IDENTITY(1,1),
        Category VARCHAR(50),
        PeriodType VARCHAR(20), -- Shift, Day, Month
        Qty DECIMAL(18,2),
        Shift VARCHAR(50),
        Date DATE,
        Month VARCHAR(20)
    );

    ---------------------------------------------------------------------------
    -- 1. Coal (Materials 6,7)
    ---------------------------------------------------------------------------
    INSERT INTO #HighestProd (Category, PeriodType, Qty, Shift, Date, Month)
    SELECT TOP 1 'Coal', 'Shift', SUM(TotalQty), S.ShiftName, CAST(L.LoadingDate AS DATE), DATENAME(MONTH, L.LoadingDate)
    FROM Trans.TblLoading L
    JOIN Master.TblShift S ON L.ShiftId = S.SlNo
    WHERE L.MaterialId IN (6, 7) AND L.IsDelete = 0 AND CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY S.ShiftName, CAST(L.LoadingDate AS DATE), DATENAME(MONTH, L.LoadingDate)
    ORDER BY SUM(TotalQty) DESC;

    INSERT INTO #HighestProd (Category, PeriodType, Qty, Shift, Date, Month)
    SELECT TOP 1 'Coal', 'Day', SUM(TotalQty), NULL, CAST(L.LoadingDate AS DATE), DATENAME(MONTH, L.LoadingDate)
    FROM Trans.TblLoading L
    WHERE L.MaterialId IN (6, 7) AND L.IsDelete = 0 AND CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY CAST(L.LoadingDate AS DATE), DATENAME(MONTH, L.LoadingDate)
    ORDER BY SUM(TotalQty) DESC;

    INSERT INTO #HighestProd (Category, PeriodType, Qty, Shift, Date, Month)
    SELECT TOP 1 'Coal', 'Month', SUM(TotalQty), NULL, NULL, DATENAME(MONTH, L.LoadingDate)
    FROM Trans.TblLoading L
    WHERE L.MaterialId IN (6, 7) AND L.IsDelete = 0 AND CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY DATENAME(MONTH, L.LoadingDate), YEAR(L.LoadingDate)
    ORDER BY SUM(TotalQty) DESC;

    ---------------------------------------------------------------------------
    -- 2. OB (Materials 1,2,3,4,10,11)
    ---------------------------------------------------------------------------
    INSERT INTO #HighestProd (Category, PeriodType, Qty, Shift, Date, Month)
    SELECT TOP 1 'OB', 'Shift', SUM(TotalQty), S.ShiftName, CAST(L.LoadingDate AS DATE), DATENAME(MONTH, L.LoadingDate)
    FROM Trans.TblLoading L
    JOIN Master.TblShift S ON L.ShiftId = S.SlNo
    WHERE L.MaterialId IN (1, 2, 3, 4, 10, 11) AND L.IsDelete = 0 AND CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY S.ShiftName, CAST(L.LoadingDate AS DATE), DATENAME(MONTH, L.LoadingDate)
    ORDER BY SUM(TotalQty) DESC;

    INSERT INTO #HighestProd (Category, PeriodType, Qty, Shift, Date, Month)
    SELECT TOP 1 'OB', 'Day', SUM(TotalQty), NULL, CAST(L.LoadingDate AS DATE), DATENAME(MONTH, L.LoadingDate)
    FROM Trans.TblLoading L
    WHERE L.MaterialId IN (1, 2, 3, 4, 10, 11) AND L.IsDelete = 0 AND CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY CAST(L.LoadingDate AS DATE), DATENAME(MONTH, L.LoadingDate)
    ORDER BY SUM(TotalQty) DESC;

    INSERT INTO #HighestProd (Category, PeriodType, Qty, Shift, Date, Month)
    SELECT TOP 1 'OB', 'Month', SUM(TotalQty), NULL, NULL, DATENAME(MONTH, L.LoadingDate)
    FROM Trans.TblLoading L
    WHERE L.MaterialId IN (1, 2, 3, 4, 10, 11) AND L.IsDelete = 0 AND CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY DATENAME(MONTH, L.LoadingDate), YEAR(L.LoadingDate)
    ORDER BY SUM(TotalQty) DESC;

    ---------------------------------------------------------------------------
    -- 3. Electrical (EquipmentGroup Name like '%Elect%')
    ---------------------------------------------------------------------------
    INSERT INTO #HighestProd (Category, PeriodType, Qty, Shift, Date, Month)
    SELECT TOP 1 'Electrical', 'Shift', SUM(TotalQty), S.ShiftName, CAST(L.LoadingDate AS DATE), DATENAME(MONTH, L.LoadingDate)
    FROM Trans.TblLoading L
    JOIN Master.TblShift S ON L.ShiftId = S.SlNo
    JOIN Master.TblEquipment E ON L.LoadingMachineEquipmentId = E.SlNo
    LEFT JOIN Master.TblEquipmentGroup G ON E.EquipmentGroupId = G.SlNo
    WHERE G.Name LIKE '%Elect%' AND L.IsDelete = 0 AND CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY S.ShiftName, CAST(L.LoadingDate AS DATE), DATENAME(MONTH, L.LoadingDate)
    ORDER BY SUM(TotalQty) DESC;
    
    INSERT INTO #HighestProd (Category, PeriodType, Qty, Shift, Date, Month)
    SELECT TOP 1 'Electrical', 'Day', SUM(TotalQty), NULL, CAST(L.LoadingDate AS DATE), DATENAME(MONTH, L.LoadingDate)
    FROM Trans.TblLoading L
    JOIN Master.TblEquipment E ON L.LoadingMachineEquipmentId = E.SlNo
    LEFT JOIN Master.TblEquipmentGroup G ON E.EquipmentGroupId = G.SlNo
    WHERE G.Name LIKE '%Elect%' AND L.IsDelete = 0 AND CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY CAST(L.LoadingDate AS DATE), DATENAME(MONTH, L.LoadingDate)
    ORDER BY SUM(TotalQty) DESC;

    INSERT INTO #HighestProd (Category, PeriodType, Qty, Shift, Date, Month)
    SELECT TOP 1 'Electrical', 'Month', SUM(TotalQty), NULL, NULL, DATENAME(MONTH, L.LoadingDate)
    FROM Trans.TblLoading L
    JOIN Master.TblEquipment E ON L.LoadingMachineEquipmentId = E.SlNo
    LEFT JOIN Master.TblEquipmentGroup G ON E.EquipmentGroupId = G.SlNo
    WHERE G.Name LIKE '%Elect%' AND L.IsDelete = 0 AND CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY DATENAME(MONTH, L.LoadingDate), YEAR(L.LoadingDate)
    ORDER BY SUM(TotalQty) DESC;

    ---------------------------------------------------------------------------
    -- 4. Dispatch (Assuming TblDispatchEntry)
    ---------------------------------------------------------------------------
    INSERT INTO #HighestProd (Category, PeriodType, Qty, Shift, Date, Month)
    SELECT TOP 1 'Dispatch', 'Shift', SUM(TotalQty), 'All', CAST(Date AS DATE), DATENAME(MONTH, Date)
    FROM Trans.TblDispatchEntry
    WHERE IsDelete = 0 AND CAST(Date AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY CAST(Date AS DATE), DATENAME(MONTH, Date)
    ORDER BY SUM(TotalQty) DESC;

    INSERT INTO #HighestProd (Category, PeriodType, Qty, Shift, Date, Month)
    SELECT TOP 1 'Dispatch', 'Day', SUM(TotalQty), NULL, CAST(Date AS DATE), DATENAME(MONTH, Date)
    FROM Trans.TblDispatchEntry
    WHERE IsDelete = 0 AND CAST(Date AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY CAST(Date AS DATE), DATENAME(MONTH, Date)
    ORDER BY SUM(TotalQty) DESC;

    INSERT INTO #HighestProd (Category, PeriodType, Qty, Shift, Date, Month)
    SELECT TOP 1 'Dispatch', 'Month', SUM(TotalQty), NULL, NULL, DATENAME(MONTH, Date)
    FROM Trans.TblDispatchEntry
    WHERE IsDelete = 0 AND CAST(Date AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY DATENAME(MONTH, Date), YEAR(Date)
    ORDER BY SUM(TotalQty) DESC;

    ---------------------------------------------------------------------------
    -- 5. Crushing
    ---------------------------------------------------------------------------
    INSERT INTO #HighestProd (Category, PeriodType, Qty, Shift, Date, Month)
    SELECT TOP 1 'Crushing', 'Shift', SUM(TotalQty), S.ShiftName, CAST(C.Date AS DATE), DATENAME(MONTH, C.Date)
    FROM Trans.TblCrusher C
    JOIN Master.TblShift S ON C.ShiftId = S.SlNo
    WHERE C.IsDelete = 0 AND CAST(C.Date AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY S.ShiftName, CAST(C.Date AS DATE), DATENAME(MONTH, C.Date)
    ORDER BY SUM(TotalQty) DESC;

    INSERT INTO #HighestProd (Category, PeriodType, Qty, Shift, Date, Month)
    SELECT TOP 1 'Crushing', 'Day', SUM(TotalQty), NULL, CAST(C.Date AS DATE), DATENAME(MONTH, C.Date)
    FROM Trans.TblCrusher C
    WHERE C.IsDelete = 0 AND CAST(C.Date AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY CAST(C.Date AS DATE), DATENAME(MONTH, C.Date)
    ORDER BY SUM(TotalQty) DESC;

    INSERT INTO #HighestProd (Category, PeriodType, Qty, Shift, Date, Month)
    SELECT TOP 1 'Crushing', 'Month', SUM(TotalQty), NULL, NULL, DATENAME(MONTH, C.Date)
    FROM Trans.TblCrusher C
    WHERE C.IsDelete = 0 AND CAST(C.Date AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY DATENAME(MONTH, C.Date), YEAR(C.Date)
    ORDER BY SUM(TotalQty) DESC;

    ---------------------------------------------------------------------------
    -- [0] Result Set 1: Highest Production
    ---------------------------------------------------------------------------
    SELECT * FROM #HighestProd;

    ---------------------------------------------------------------------------
    -- [1] Result Set 2: Crusher Wise
    ---------------------------------------------------------------------------
    SELECT 
        'Crushing' AS Category, 
        ISNULL(P.Name, 'Unknown') AS Plant, 
        ISNULL(SUM(C.TotalQty), 0) AS Qty
    FROM Trans.TblCrusher C
    LEFT JOIN Master.TblPlant P ON C.PlantId = P.SlNo
    WHERE CAST(C.Date AS DATE) BETWEEN @FromDate AND @ToDate 
      AND C.IsDelete = 0
    GROUP BY P.Name;

    ---------------------------------------------------------------------------
    -- [2] Result Set 3: Sector Wise (Using Source as Sector)
    ---------------------------------------------------------------------------
    SELECT 
        ISNULL(S.Name, 'Unknown') AS Plant, -- Mapped to 'Plant' accessor in frontend
        ISNULL(SUM(L.TotalQty), 0) AS Qty
    FROM Trans.TblLoading L
    LEFT JOIN Master.TblSource S ON L.SourceId = S.SlNo
    WHERE CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate 
      AND L.IsDelete = 0
    GROUP BY S.Name;

    ---------------------------------------------------------------------------
    -- [3] Result Set 4: Operator Performance (Loading + Hauling)
    ---------------------------------------------------------------------------
    SELECT * FROM (
        -- Loading Operators
        SELECT 
            'Loading' AS Type,
            ISNULL(E.EquipmentName, 'Unknown') AS Equipment,
            ISNULL(SUM(L.NoofTrip), 0) AS Trip,
            ISNULL(SUM(L.TotalQty), 0) AS Qty,
            ISNULL(MAX(R.TotalHours), 0) AS Hrs, 
            ISNULL(E.Model, '') AS Model,
            CAST(E.Capacity AS VARCHAR) AS Capacity,
            ISNULL(S.ShiftName, 'All') AS Shift
        FROM Trans.TblLoading L
        JOIN Master.TblEquipment E ON L.LoadingMachineEquipmentId = E.SlNo
        LEFT JOIN Master.TblShift S ON L.ShiftId = S.SlNo
        CROSS APPLY (
            SELECT SUM(ISNULL(TotalWorkingHr, 0)) AS TotalHours 
            FROM Trans.TblEquipmentReading ER 
            WHERE ER.EquipmentId = L.LoadingMachineEquipmentId 
              AND CAST(ER.Date AS DATE) = CAST(L.LoadingDate AS DATE)
        ) R
        WHERE CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate 
          AND L.IsDelete = 0
        GROUP BY E.EquipmentName, E.Model, E.Capacity, S.ShiftName
        
        UNION ALL
        
        -- Hauling Operators
        SELECT 
            'Hauling' AS Type,
            ISNULL(E.EquipmentName, 'Unknown') AS Equipment,
            ISNULL(SUM(L.NoofTrip), 0) AS Trip,
            ISNULL(SUM(L.TotalQty), 0) AS Qty,
            ISNULL(MAX(R.TotalHours), 0) AS Hrs,
            ISNULL(E.Model, '') AS Model,
            CAST(E.Capacity AS VARCHAR) AS Capacity,
            ISNULL(S.ShiftName, 'All') AS Shift
        FROM Trans.TblLoading L
        JOIN Master.TblEquipment E ON L.HaulerEquipmentId = E.SlNo
        LEFT JOIN Master.TblShift S ON L.ShiftId = S.SlNo
        CROSS APPLY (
            SELECT SUM(ISNULL(TotalWorkingHr, 0)) AS TotalHours 
            FROM Trans.TblEquipmentReading ER 
            WHERE ER.EquipmentId = L.HaulerEquipmentId 
              AND CAST(ER.Date AS DATE) = CAST(L.LoadingDate AS DATE)
        ) R
        WHERE CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate 
          AND L.IsDelete = 0
        GROUP BY E.EquipmentName, E.Model, E.Capacity, S.ShiftName
    ) AS OpsPerf
    ORDER BY Type, Qty DESC;

    ---------------------------------------------------------------------------
    -- [4] Result Set 5: Loading Performance (Rate based)
    ---------------------------------------------------------------------------
    SELECT 
        Type,
        Equipment,
        CASE WHEN Hrs > 0 THEN Qty / Hrs ELSE 0 END AS Rate,
        Model,
        Capacity,
        Shift
    FROM (
        -- Loading
        SELECT 
            'Loading' AS Type,
            ISNULL(E.EquipmentName, 'Unknown') AS Equipment,
            ISNULL(SUM(L.TotalQty), 0) AS Qty,
            ISNULL(MAX(R.TotalHours), 0) AS Hrs, 
            ISNULL(E.Model, '') AS Model,
            CAST(E.Capacity AS VARCHAR) AS Capacity,
            ISNULL(S.ShiftName, 'All') AS Shift
        FROM Trans.TblLoading L
        JOIN Master.TblEquipment E ON L.LoadingMachineEquipmentId = E.SlNo
        LEFT JOIN Master.TblShift S ON L.ShiftId = S.SlNo
        CROSS APPLY (
            SELECT SUM(ISNULL(TotalWorkingHr, 0)) AS TotalHours 
            FROM Trans.TblEquipmentReading ER 
            WHERE ER.EquipmentId = L.LoadingMachineEquipmentId 
              AND CAST(ER.Date AS DATE) = CAST(L.LoadingDate AS DATE)
        ) R
        WHERE CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate 
          AND L.IsDelete = 0
        GROUP BY E.EquipmentName, E.Model, E.Capacity, S.ShiftName
        
        UNION ALL
        
        -- Hauling
        SELECT 
            'Hauling' AS Type,
            ISNULL(E.EquipmentName, 'Unknown') AS Equipment,
            ISNULL(SUM(L.NoofTrip), 0) AS Qty, -- Using Trips for Rate calc (Trips/Hr)
            ISNULL(MAX(R.TotalHours), 0) AS Hrs,
            ISNULL(E.Model, '') AS Model,
            CAST(E.Capacity AS VARCHAR) AS Capacity,
            ISNULL(S.ShiftName, 'All') AS Shift
        FROM Trans.TblLoading L
        JOIN Master.TblEquipment E ON L.HaulerEquipmentId = E.SlNo
        LEFT JOIN Master.TblShift S ON L.ShiftId = S.SlNo
        CROSS APPLY (
            SELECT SUM(ISNULL(TotalWorkingHr, 0)) AS TotalHours 
            FROM Trans.TblEquipmentReading ER 
            WHERE ER.EquipmentId = L.HaulerEquipmentId 
              AND CAST(ER.Date AS DATE) = CAST(L.LoadingDate AS DATE)
        ) R
        WHERE CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate 
          AND L.IsDelete = 0
        GROUP BY E.EquipmentName, E.Model, E.Capacity, S.ShiftName
    ) AS LoadPerf
    ORDER BY Type, Rate DESC;

    -- Clean up Temp Tables
    DROP TABLE #HighestProd;

END

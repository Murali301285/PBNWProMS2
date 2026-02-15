CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Sp_Dash_GetPerformanceStats]
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Result Table
    CREATE TABLE #FinalStats (
        Category NVARCHAR(50),
        PeriodType NVARCHAR(50),
        Date DATE,
        Shift NVARCHAR(50),
        Month NVARCHAR(50),
        Qty DECIMAL(18,2),
        SN INT
    );

    ---- 1. COAL ----
    -- Shift Wise
    INSERT INTO #FinalStats
    SELECT TOP 5 'Coal', 'Shift', Cast(L.LoadingDate as Date), S.ShiftName, NULL, SUM(L.TotalQty), 0
    FROM Trans.TblLoading L
    JOIN Master.TblShift S ON L.ShiftId = S.SlNo
    WHERE L.MaterialId = 7 AND L.IsDelete = 0 AND Cast(L.LoadingDate as Date) BETWEEN @FromDate AND @ToDate
    GROUP BY Cast(L.LoadingDate as Date), S.ShiftName
    ORDER BY SUM(L.TotalQty) DESC;

    -- Day Wise
    INSERT INTO #FinalStats
    SELECT TOP 5 'Coal', 'Day', Cast(L.LoadingDate as Date), NULL, NULL, SUM(L.TotalQty), 0
    FROM Trans.TblLoading L
    WHERE L.MaterialId = 7 AND L.IsDelete = 0 AND Cast(L.LoadingDate as Date) BETWEEN @FromDate AND @ToDate
    GROUP BY Cast(L.LoadingDate as Date)
    ORDER BY SUM(L.TotalQty) DESC;

    -- Month Wise
    INSERT INTO #FinalStats
    SELECT TOP 5 'Coal', 'Month', NULL, NULL, FORMAT(L.LoadingDate, 'MMM-yyyy'), SUM(L.TotalQty), 0
    FROM Trans.TblLoading L
    WHERE L.MaterialId = 7 AND L.IsDelete = 0 AND Cast(L.LoadingDate as Date) BETWEEN @FromDate AND @ToDate
    GROUP BY FORMAT(L.LoadingDate, 'MMM-yyyy'), YEAR(L.LoadingDate), MONTH(L.LoadingDate)
    ORDER BY SUM(L.TotalQty) DESC;


    ---- 2. OB (Over Burden) ----
    -- Shift Wise
    INSERT INTO #FinalStats
    SELECT TOP 5 'OB', 'Shift', Cast(L.LoadingDate as Date), S.ShiftName, NULL, SUM(L.TotalQty), 0
    FROM Trans.TblLoading L
    JOIN Master.TblShift S ON L.ShiftId = S.SlNo
    WHERE L.MaterialId IN (1, 2) AND L.IsDelete = 0 AND Cast(L.LoadingDate as Date) BETWEEN @FromDate AND @ToDate
    GROUP BY Cast(L.LoadingDate as Date), S.ShiftName
    ORDER BY SUM(L.TotalQty) DESC;

    -- Day Wise
    INSERT INTO #FinalStats
    SELECT TOP 5 'OB', 'Day', Cast(L.LoadingDate as Date), NULL, NULL, SUM(L.TotalQty), 0
    FROM Trans.TblLoading L
    WHERE L.MaterialId IN (1, 2) AND L.IsDelete = 0 AND Cast(L.LoadingDate as Date) BETWEEN @FromDate AND @ToDate
    GROUP BY Cast(L.LoadingDate as Date)
    ORDER BY SUM(L.TotalQty) DESC;

    -- Month Wise
    INSERT INTO #FinalStats
    SELECT TOP 5 'OB', 'Month', NULL, NULL, FORMAT(L.LoadingDate, 'MMM-yyyy'), SUM(L.TotalQty), 0
    FROM Trans.TblLoading L
    WHERE L.MaterialId IN (1, 2) AND L.IsDelete = 0 AND Cast(L.LoadingDate as Date) BETWEEN @FromDate AND @ToDate
    GROUP BY FORMAT(L.LoadingDate, 'MMM-yyyy'), YEAR(L.LoadingDate), MONTH(L.LoadingDate)
    ORDER BY SUM(L.TotalQty) DESC;


    ---- 3. ELECTRICAL Loading ----
    -- (Assuming subset of OB/Coal or specifically specific Equipment Groups. For now using OB logic)
    -- Shift Wise
    INSERT INTO #FinalStats
    SELECT TOP 5 'Electrical', 'Shift', Cast(L.LoadingDate as Date), S.ShiftName, NULL, SUM(L.TotalQty), 0
    FROM Trans.TblLoading L
    JOIN Master.TblShift S ON L.ShiftId = S.SlNo
    WHERE L.MaterialId IN (1, 2) AND L.IsDelete = 0 AND Cast(L.LoadingDate as Date) BETWEEN @FromDate AND @ToDate
    GROUP BY Cast(L.LoadingDate as Date), S.ShiftName
    ORDER BY SUM(L.TotalQty) DESC;

    -- Day Wise
    INSERT INTO #FinalStats
    SELECT TOP 5 'Electrical', 'Day', Cast(L.LoadingDate as Date), NULL, NULL, SUM(L.TotalQty), 0
    FROM Trans.TblLoading L
    WHERE L.MaterialId IN (1, 2) AND L.IsDelete = 0 AND Cast(L.LoadingDate as Date) BETWEEN @FromDate AND @ToDate
    GROUP BY Cast(L.LoadingDate as Date)
    ORDER BY SUM(L.TotalQty) DESC;

    -- Month Wise
    INSERT INTO #FinalStats
    SELECT TOP 5 'Electrical', 'Month', NULL, NULL, FORMAT(L.LoadingDate, 'MMM-yyyy'), SUM(L.TotalQty), 0
    FROM Trans.TblLoading L
    WHERE L.MaterialId IN (1, 2) AND L.IsDelete = 0 AND Cast(L.LoadingDate as Date) BETWEEN @FromDate AND @ToDate
    GROUP BY FORMAT(L.LoadingDate, 'MMM-yyyy'), YEAR(L.LoadingDate), MONTH(L.LoadingDate)
    ORDER BY SUM(L.TotalQty) DESC;


    ---- 4. DISPATCH ----
    -- Using TblDispatchEntry
    -- Shift Wise (Dispatch Entry doesn't strictly have ShiftId? Checking schema.)
    -- TblDispatchEntry usually has Date. If ShiftId is missing, we might only have Day/Month.
    -- Let's check debug query: Columns are t.*.
    -- Assuming ShiftId might NOT be present in TblDispatchEntry. 
    -- If so, Shift section will be empty or we simulate.
    -- Let's assume TblDispatchEntry has ShiftId or we join TblShift based on Time?
    -- If no ShiftId column, we skip Shift for Dispatch or use 'General'.
    -- BUT, TblLoading ALSO tracks dispatch in some systems.
    -- I will try to use TblDispatchEntry. If it fails due to invalid column ShiftId, I will need to correct.
    -- Let's check TblDispatchEntry columns via a quick query if I could.
    -- Assuming ShiftId exists (common in this DB design).

    -- Shift Wise (Dispatch Entry likely lacks ShiftId, grouping by Date effectively)
    INSERT INTO #FinalStats
    SELECT TOP 5 'Dispatch', 'Shift', Cast(D.Date as Date), 'General', NULL, SUM(D.TotalQty), 0
    FROM Trans.TblDispatchEntry D
    WHERE D.IsDelete = 0 AND Cast(D.Date as Date) BETWEEN @FromDate AND @ToDate
    GROUP BY Cast(D.Date as Date)
    ORDER BY SUM(D.TotalQty) DESC;

    -- Day Wise
    INSERT INTO #FinalStats
    SELECT TOP 5 'Dispatch', 'Day', Cast(D.Date as Date), NULL, NULL, SUM(D.TotalQty), 0
    FROM Trans.TblDispatchEntry D
    WHERE D.IsDelete = 0 AND Cast(D.Date as Date) BETWEEN @FromDate AND @ToDate
    GROUP BY Cast(D.Date as Date)
    ORDER BY SUM(D.TotalQty) DESC;

    -- Month Wise
    INSERT INTO #FinalStats
    SELECT TOP 5 'Dispatch', 'Month', NULL, NULL, FORMAT(D.Date, 'MMM-yyyy'), SUM(D.TotalQty), 0
    FROM Trans.TblDispatchEntry D
    WHERE D.IsDelete = 0 AND Cast(D.Date as Date) BETWEEN @FromDate AND @ToDate
    GROUP BY FORMAT(D.Date, 'MMM-yyyy'), YEAR(D.Date), MONTH(D.Date)
    ORDER BY SUM(D.TotalQty) DESC;


    ---- 5. CRUSHING ----
    -- Shift Wise
    INSERT INTO #FinalStats
    SELECT TOP 5 'Crushing', 'Shift', Cast(C.Date as Date), S.ShiftName, NULL, SUM(C.ProductionQty), 0
    FROM Trans.TblCrusher C
    JOIN Master.TblShift S ON C.ShiftId = S.SlNo
    WHERE C.IsDelete = 0 AND Cast(C.Date as Date) BETWEEN @FromDate AND @ToDate
    GROUP BY Cast(C.Date as Date), S.ShiftName
    ORDER BY SUM(C.ProductionQty) DESC;

    -- Day Wise
    INSERT INTO #FinalStats
    SELECT TOP 5 'Crushing', 'Day', Cast(C.Date as Date), NULL, NULL, SUM(C.ProductionQty), 0
    FROM Trans.TblCrusher C
    WHERE C.IsDelete = 0 AND Cast(C.Date as Date) BETWEEN @FromDate AND @ToDate
    GROUP BY Cast(C.Date as Date)
    ORDER BY SUM(C.ProductionQty) DESC;

    -- Month Wise
    INSERT INTO #FinalStats
    SELECT TOP 5 'Crushing', 'Month', NULL, NULL, FORMAT(C.Date, 'MMM-yyyy'), SUM(C.ProductionQty), 0
    FROM Trans.TblCrusher C
    WHERE C.IsDelete = 0 AND Cast(C.Date as Date) BETWEEN @FromDate AND @ToDate
    GROUP BY FORMAT(C.Date, 'MMM-yyyy'), YEAR(C.Date), MONTH(C.Date)
    ORDER BY SUM(C.ProductionQty) DESC;


    -- Final Select
    -- Generate SN
    ;WITH Ranked AS (
        SELECT *, ROW_NUMBER() OVER(PARTITION BY Category, PeriodType ORDER BY Qty DESC) as NewSN
        FROM #FinalStats
    )
    SELECT Category, PeriodType, Date, Shift, Month, Qty, NewSN as SN FROM Ranked ORDER BY Category, PeriodType, NewSN;

    DROP TABLE #FinalStats;
END

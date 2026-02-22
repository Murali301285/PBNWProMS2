ALTER PROCEDURE [dbo].[PMS2_New_Dash_SP_Crushing_ProductionOverview]
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    CREATE TABLE #TargetSectors (SectorId INT, SectorName VARCHAR(100));
    
    INSERT INTO #TargetSectors (SectorId, SectorName)
    SELECT SlNo, SectorName
    FROM Master.TblSector WITH(NOLOCK)
    WHERE SectorName IN ('Sector 1 WP-1', 'Sector-2', 'Sector-3', 'Sector-4', 'WP-3');

    -- Temporary table to hold Daily/Shift Production by Sector
    CREATE TABLE #SectorProd (
        SectorName VARCHAR(100),
        Date DATE,
        ShiftId INT,
        Qty DECIMAL(18,2)
    );

    INSERT INTO #SectorProd (SectorName, Date, ShiftId, Qty)
    SELECT 
        S.SectorName,
        CAST(L.LoadingDate AS DATE),
        L.ShiftId,
        SUM(ISNULL(L.QtyTrip, 0))
    FROM Trans.TblLoading L WITH(NOLOCK)
    CROSS APPLY (
        SELECT TOP 1 S.SectorName
        FROM Trans.TblEquipmentReading R WITH(NOLOCK)
        JOIN #TargetSectors S ON R.SectorId = S.SectorId
        WHERE CAST(R.Date AS DATE) = CAST(L.LoadingDate AS DATE) 
          AND R.ShiftId = L.ShiftId 
          AND R.EquipmentId IN (L.LoadingMachineEquipmentId, L.HaulerEquipmentId)
          AND R.IsDelete = 0
    ) S
    WHERE L.IsDelete = 0
      AND CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY S.SectorName, CAST(L.LoadingDate AS DATE), L.ShiftId;

    -- 1. Shift Wise
    SELECT 
        'Shift' AS PeriodType,
        SectorName AS Category,
        Date,
        CASE 
            WHEN ShiftId = 1 THEN 'Shift A'
            WHEN ShiftId = 2 THEN 'Shift B'
            WHEN ShiftId = 3 THEN 'Shift C'
            ELSE 'Unknown'
        END AS Shift,
        SUM(Qty) AS Qty
    FROM #SectorProd
    GROUP BY SectorName, Date, ShiftId
    
    UNION ALL

    -- 2. Day Wise
    SELECT 
        'Day' AS PeriodType,
        SectorName AS Category,
        Date,
        NULL AS Shift,
        SUM(Qty) AS Qty
    FROM #SectorProd
    GROUP BY SectorName, Date

    UNION ALL

    -- 3. Month Wise
    SELECT 
        'Month' AS PeriodType,
        SectorName AS Category,
        NULL AS Date,
        NULL AS Shift,
        SUM(Qty) AS Qty
    FROM #SectorProd
    GROUP BY SectorName, FORMAT(Date, 'MMM-yyyy');

    DROP TABLE #SectorProd;
    DROP TABLE #TargetSectors;
END

CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Dash_SP_Performance_CoalOBProduction]
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Date Range Generation
    WITH DateRange AS (
        SELECT @FromDate AS DateValue
        UNION ALL
        SELECT DATEADD(DAY, 1, DateValue)
        FROM DateRange
        WHERE DateValue < @ToDate
    ),
    
    -- 2. Equipment Sectors (Distinct mapping to prevent duplicates)
    EquipSectors AS (
        SELECT DISTINCT 
            ER.EquipmentId, 
            CAST(ER.Date AS DATE) AS Date, 
            ER.ShiftId, 
            ER.SectorId
        FROM Trans.TblEquipmentReading ER WITH(NOLOCK)
        WHERE CAST(ER.Date AS DATE) BETWEEN @FromDate AND @ToDate
          AND ER.IsDelete = 0
    ),
    
    -- 3. Production Data (Coal & OB from TblLoading)
    ProductionData AS (
        SELECT 
            CAST(L.LoadingDate AS DATE) AS ProductionDate,
            
            -- Coal 
            SUM(CASE WHEN T6.MaterialName IN ('ROM COAL') THEN L.TotalQty ELSE 0 END) AS Coal_Total,
            SUM(CASE WHEN T6.MaterialName IN ('ROM COAL') AND ISNULL(ES.SectorId, 0) = 5 THEN L.TotalQty ELSE 0 END) AS Coal_WP3,

            -- OB
            SUM(CASE WHEN T6.MaterialName IN ('OB', 'OVER BURDEN') THEN L.TotalQty ELSE 0 END) AS OB_Total,
            SUM(CASE WHEN T6.MaterialName IN ('OB', 'OVER BURDEN') AND ISNULL(ES.SectorId, 0) = 5 THEN L.TotalQty ELSE 0 END) AS OB_WP3

        FROM Trans.TblLoading L WITH(NOLOCK)
        JOIN [Master].TblShift T1 WITH(NOLOCK) on T1.SlNo=L.ShiftId
        JOIN [Master].TblSource T2 WITH(NOLOCK) on T2.SlNo=L.SourceId
        JOIN [Master].TblDestination T3 WITH(NOLOCK) on T3.SlNo=L.DestinationId
        JOIN [Master].TblEquipment T4 WITH(NOLOCK) on T4.SlNo=L.HaulerEquipmentId
        JOIN [Master].TblEquipment T5 WITH(NOLOCK) on T5.SlNo=L.LoadingMachineEquipmentId
        JOIN [Master].TblMaterial T6 WITH(NOLOCK) on T6.SlNo=L.MaterialId
        JOIN [Master].TblScale T7 WITH(NOLOCK) on T7.SlNo=T4.ScaleId
        JOIN [Master].TblRelay T8 WITH(NOLOCK) on T8.SlNo=L.RelayId
        JOIN [Master].TblEquipmentGroup T9 WITH(NOLOCK) on T9.SlNo=T4.EquipmentGroupId
        JOIN [Master].TblEquipmentGroup T10 WITH(NOLOCK) on T10.SlNo=T5.EquipmentGroupId
        LEFT JOIN EquipSectors ES 
            ON L.LoadingMachineEquipmentId = ES.EquipmentId 
            AND L.ShiftId = ES.ShiftId 
            AND CAST(L.LoadingDate AS DATE) = ES.Date
        WHERE L.IsDelete = 0 
          AND CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate
        GROUP BY CAST(L.LoadingDate AS DATE)
    ),

    -- 4. Rehandling Data (Coal & OB from TblMaterialRehandling)
    RehandlingData AS (
        SELECT 
            CAST(RH.RehandlingDate AS DATE) AS RehandlingDate,

            -- Coal Rehandling
            SUM(CASE WHEN Mt.MaterialName IN ('ROM COAL') THEN RH.TotalQty ELSE 0 END) AS CoalRehandling_Total,
            SUM(CASE WHEN Mt.MaterialName IN ('ROM COAL') AND ISNULL(ES.SectorId, 0) = 5 THEN RH.TotalQty ELSE 0 END) AS CoalRehandling_WP3,

            -- OB Rehandling
            SUM(CASE WHEN Mt.MaterialName IN ('OB', 'OVER BURDEN') THEN RH.TotalQty ELSE 0 END) AS OBRehandling_Total,
            SUM(CASE WHEN Mt.MaterialName IN ('OB', 'OVER BURDEN') AND ISNULL(ES.SectorId, 0) = 5 THEN RH.TotalQty ELSE 0 END) AS OBRehandling_WP3

        FROM Trans.TblMaterialRehandling RH WITH(NOLOCK)
        LEFT JOIN EquipSectors ES 
            ON RH.LoadingMachineEquipmentId = ES.EquipmentId 
            AND RH.ShiftId = ES.ShiftId 
            AND CAST(RH.RehandlingDate AS DATE) = ES.Date
        LEFT JOIN Master.TblMaterial Mt WITH(NOLOCK) 
            ON RH.MaterialId = Mt.SlNo
        WHERE RH.IsDelete = 0
          AND CAST(RH.RehandlingDate AS DATE) BETWEEN @FromDate AND @ToDate
        GROUP BY CAST(RH.RehandlingDate AS DATE)
    )

    -- 5. Final Result using Date Range Left Join
    -- Here we derive Main Pit as (Total - WP3) exactly as requested.
    SELECT 
        FORMAT(D.DateValue, 'dd-MMM-yyyy') AS DateDisplay,
        D.DateValue AS SortDate,
        ISNULL(P.Coal_Total, 0) - ISNULL(P.Coal_WP3, 0) AS Coal_MainPit,
        ISNULL(P.Coal_WP3, 0) AS Coal_WP3,
        ISNULL(P.OB_Total, 0) - ISNULL(P.OB_WP3, 0) AS OB_MainPit,
        ISNULL(P.OB_WP3, 0) AS OB_WP3,
        ISNULL(RH.OBRehandling_Total, 0) - ISNULL(RH.OBRehandling_WP3, 0) AS OBRehandling_MainPit,
        ISNULL(RH.OBRehandling_WP3, 0) AS OBRehandling_WP3,
        ISNULL(RH.CoalRehandling_Total, 0) - ISNULL(RH.CoalRehandling_WP3, 0) AS CoalRehandling_MainPit,
        ISNULL(RH.CoalRehandling_WP3, 0) AS CoalRehandling_WP3
    FROM DateRange D
    LEFT JOIN ProductionData P ON D.DateValue = P.ProductionDate
    LEFT JOIN RehandlingData RH ON D.DateValue = RH.RehandlingDate
    ORDER BY D.DateValue
    OPTION (MAXRECURSION 0);
END

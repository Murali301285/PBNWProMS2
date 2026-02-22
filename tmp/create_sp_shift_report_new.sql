CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_sp_ShiftReport]
    @Date DATE,
    @ShiftId INT
AS
BEGIN
    SET NOCOUNT ON;

    -------------------------------------------------------------------
    -- SECTION 0: Incharge Details
    -------------------------------------------------------------------
    ;WITH UniqueIncharges AS (
        SELECT DISTINCT 
            Sl.Name AS ScaleName,
            Op.OperatorName
        FROM [Trans].[TblEquipmentReading] ER WITH(NOLOCK)
        LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON ER.EquipmentId = Eq.SlNo
        LEFT JOIN [Master].[TblScale] Sl WITH(NOLOCK) ON Eq.ScaleId = Sl.SlNo
        LEFT JOIN [Trans].[TblEquipmentReadingShiftIncharge] SI WITH(NOLOCK) ON SI.EquipmentReadingId = ER.SlNo
        LEFT JOIN [Master].[TblOperator] Op WITH(NOLOCK) ON SI.OperatorId = Op.SlNo 
        WHERE Eq.IsDelete = 0 
          AND CAST(ER.Date AS DATE) = @Date
          AND ER.ShiftId = @ShiftId
          AND Op.OperatorName IS NOT NULL
    )
    SELECT 
        ScaleName,
        STRING_AGG(CAST(OperatorName AS NVARCHAR(MAX)), ', ') AS ShiftInchare
    FROM UniqueIncharges
    GROUP BY ScaleName;

    -------------------------------------------------------------------
    -- SECTION A.1: TRIP-QUANTITY DETAILS (COAL)
    -------------------------------------------------------------------
    SELECT
        MAX(S.ShiftName) AS ShiftName,
        Sl.Name AS Scale,
        'ROM COAL' AS MaterialName,
        
        -- Shift Production (@ShiftId)
        SUM(CASE WHEN L.ShiftId = @ShiftId THEN 1 ELSE 0 END) AS Shift_Trips,
        SUM(CASE WHEN L.ShiftId = @ShiftId THEN L.TotalQty ELSE 0 END) AS Shift_Qty,
        
        -- FTD Production (All Shifts for @Date)
        COUNT(L.SlNo) AS FTD_Trips,
        SUM(L.TotalQty) AS FTD_Qty

    FROM [Trans].[TblLoading] L WITH(NOLOCK)
    LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON L.HaulerEquipmentId = Eq.SlNo
    LEFT JOIN [Master].[TblShift] S WITH(NOLOCK) ON S.SlNo = @ShiftId 
    LEFT JOIN [Master].[TblScale] Sl WITH(NOLOCK) ON Eq.ScaleId = Sl.SlNo
    WHERE L.IsDelete = 0 
      AND CAST(L.LoadingDate AS DATE) = @Date
      AND L.MaterialId = 7 -- ROM COAL
    GROUP BY Sl.Name;

    -------------------------------------------------------------------
    -- SECTION A.2: TRIP-QUANTITY DETAILS (OB)
    -------------------------------------------------------------------
    SELECT
        MAX(S.ShiftName) AS ShiftName,
        Sl.Name AS Scale,
        'OB' AS MaterialName,
        
        -- Shift Production
        SUM(CASE WHEN L.ShiftId = @ShiftId THEN 1 ELSE 0 END) AS Shift_Trips,
        SUM(CASE WHEN L.ShiftId = @ShiftId THEN L.TotalQty ELSE 0 END) AS Shift_Qty,
        
        -- FTD Production
        COUNT(L.SlNo) AS FTD_Trips,
        SUM(L.TotalQty) AS FTD_Qty

    FROM [Trans].[TblLoading] L WITH(NOLOCK)
    LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON L.HaulerEquipmentId = Eq.SlNo
    LEFT JOIN [Master].[TblShift] S WITH(NOLOCK) ON S.SlNo = @ShiftId
    LEFT JOIN [Master].[TblScale] Sl WITH(NOLOCK) ON Eq.ScaleId = Sl.SlNo
    LEFT JOIN [Master].[TblMaterial] Mt WITH(NOLOCK) ON L.MaterialId = Mt.SlNo
    WHERE L.IsDelete = 0 
      AND CAST(L.LoadingDate AS DATE) = @Date
      AND Mt.MaterialName IN ('OB', 'OVER BURDEN')
    GROUP BY Sl.Name;

    -------------------------------------------------------------------
    -- SECTION B: LOADING EQUIPMENT'S TRIP DETAILS (Selected Shift)
    -------------------------------------------------------------------
    SELECT
        Eq.EquipmentName AS LoadingEquipment,
        
        -- Trip Counts by Material
        SUM(CASE WHEN Mt.MaterialName IN ('OVER BURDEN', 'INTER BURDEN') THEN 1 ELSE 0 END) AS OBIB_Trip,
        SUM(CASE WHEN Mt.MaterialName = 'TOP SOIL' THEN 1 ELSE 0 END) AS TopSoil_Trip,
        SUM(CASE WHEN Mt.MaterialName = 'ROM COAL' THEN 1 ELSE 0 END) AS Coal_Trip,
        COUNT(L.SlNo) AS Total_Trip,
        
        -- Quantities
        SUM(CASE WHEN Mt.MaterialName IN ('OVER BURDEN', 'INTER BURDEN', 'TOP SOIL') THEN L.TotalQty ELSE 0 END) AS BCM,
        SUM(CASE WHEN Mt.MaterialName = 'ROM COAL' THEN L.TotalQty ELSE 0 END) AS MT,
        
        -- Working Hours & Location
        MAX(ER.TotalWorkingHr) AS WHr, 
        MAX(So.Name) AS Location

    FROM [Trans].[TblLoading] L WITH(NOLOCK)
    LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON L.LoadingMachineEquipmentId = Eq.SlNo
    LEFT JOIN [Master].[TblMaterial] Mt WITH(NOLOCK) ON L.MaterialId = Mt.SlNo
    LEFT JOIN [Master].[TblSource] So WITH(NOLOCK) ON L.SourceId = So.SlNo
    LEFT JOIN [Trans].[TblEquipmentReading] ER WITH(NOLOCK) 
        ON ER.EquipmentId = Eq.SlNo 
        AND CAST(ER.Date AS DATE) = @Date 
        AND ER.ShiftId = @ShiftId
        AND ER.IsDelete = 0
    WHERE L.IsDelete = 0 
      AND CAST(L.LoadingDate AS DATE) = @Date
      AND L.ShiftId = @ShiftId
      AND Eq.ActivityId = 3 -- for loading
    GROUP BY Eq.EquipmentName
    ORDER BY Eq.EquipmentName;

    -------------------------------------------------------------------
    -- SECTION C.1: Loading Equipment (in Coal) Summary
    -------------------------------------------------------------------
    SELECT
        Eg.Name AS EquipmentModel,
        COUNT(L.SlNo) AS Trips,
        SUM(L.TotalQty) AS MT,
        COUNT(DISTINCT L.LoadingMachineEquipmentId) AS EqCount,
        SUM(DISTINCT ER.TotalWorkingHr) AS TotalHrs 
    FROM [Trans].[TblLoading] L WITH(NOLOCK)
    LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON L.LoadingMachineEquipmentId = Eq.SlNo
    LEFT JOIN [Master].[TblEquipmentGroup] Eg WITH(NOLOCK) ON Eq.EquipmentGroupId = Eg.SlNo
    LEFT JOIN [Trans].[TblEquipmentReading] ER WITH(NOLOCK) 
        ON ER.EquipmentId = Eq.SlNo 
        AND ER.ShiftId = @ShiftId 
        AND CAST(ER.Date AS DATE) = @Date
    WHERE L.IsDelete = 0 
      AND CAST(L.LoadingDate AS DATE) = @Date
      AND L.ShiftId = @ShiftId
      AND L.MaterialId = 7 -- ROM COAL
    GROUP BY Eg.Name;

    -------------------------------------------------------------------
    -- SECTION C.2: Loading Equipment (in Waste) Summary
    -------------------------------------------------------------------
    SELECT
        Eg.Name AS EquipmentModel,
        COUNT(L.SlNo) AS Trips,
        SUM(L.TotalQty) AS BCM,
        COUNT(DISTINCT L.LoadingMachineEquipmentId) AS EqCount,
        SUM(DISTINCT ER.TotalWorkingHr) AS TotalHrs
    FROM [Trans].[TblLoading] L WITH(NOLOCK)
    LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON L.LoadingMachineEquipmentId = Eq.SlNo
    LEFT JOIN [Master].[TblEquipmentGroup] Eg WITH(NOLOCK) ON Eq.EquipmentGroupId = Eg.SlNo
    LEFT JOIN [Trans].[TblEquipmentReading] ER WITH(NOLOCK) 
        ON ER.EquipmentId = Eq.SlNo 
        AND ER.ShiftId = @ShiftId 
        AND CAST(ER.Date AS DATE) = @Date
    WHERE L.IsDelete = 0 
      AND CAST(L.LoadingDate AS DATE) = @Date
      AND L.ShiftId = @ShiftId
      AND L.MaterialId <> 7 -- Waste
    GROUP BY Eg.Name;

    -------------------------------------------------------------------
    -- SECTION D.1: Hauling Equipment (Coal)
    -------------------------------------------------------------------
    SELECT
        ISNULL(Eg.Name, 'Unknown') AS Equip,
        COUNT(L.SlNo) AS Trip,
        SUM(L.TotalQty) AS MT
    FROM [Trans].[TblLoading] L WITH(NOLOCK)
    LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON L.HaulerEquipmentId = Eq.SlNo
    LEFT JOIN [Master].[TblEquipmentGroup] Eg WITH(NOLOCK) ON Eq.EquipmentGroupId = Eg.SlNo
    WHERE L.IsDelete = 0 
      AND CAST(L.LoadingDate AS DATE) = @Date
      AND L.ShiftId = @ShiftId
      AND L.MaterialId = 7 -- Coal
    GROUP BY ISNULL(Eg.Name, 'Unknown');

    -------------------------------------------------------------------
    -- SECTION D.2: Hauling Equipment (Waste)
    -------------------------------------------------------------------
    SELECT
        ISNULL(Eg.Name, 'Unknown') AS Equip,
        COUNT(L.SlNo) AS Trip,
        SUM(L.TotalQty) AS BCM
    FROM [Trans].[TblLoading] L WITH(NOLOCK)
    LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON L.HaulerEquipmentId = Eq.SlNo
    LEFT JOIN [Master].[TblEquipmentGroup] Eg WITH(NOLOCK) ON Eq.EquipmentGroupId = Eg.SlNo
    WHERE L.IsDelete = 0 
      AND CAST(L.LoadingDate AS DATE) = @Date
      AND L.ShiftId = @ShiftId
      AND L.MaterialId <> 7 -- Waste
    GROUP BY ISNULL(Eg.Name, 'Unknown');

    -------------------------------------------------------------------
    -- SECTION E.1: Dump Wise (Coal)
    -------------------------------------------------------------------
    SELECT
        De.Name AS DumpWise,
        COUNT(L.SlNo) AS Trips,
        SUM(L.TotalQty) AS MT
    FROM [Trans].[TblLoading] L WITH(NOLOCK)
    LEFT JOIN [Master].[TblDestination] De WITH(NOLOCK) ON L.DestinationId = De.SlNo
    WHERE L.IsDelete = 0 
      AND CAST(L.LoadingDate AS DATE) = @Date
      AND L.ShiftId = @ShiftId
      AND L.MaterialId = 7 -- Coal
    GROUP BY De.Name;

    -------------------------------------------------------------------
    -- SECTION E.2: Dump Wise (Waste)
    -------------------------------------------------------------------
    SELECT
        De.Name AS DumpWise,
        COUNT(L.SlNo) AS Trips,
        SUM(L.TotalQty) AS BCM
    FROM [Trans].[TblLoading] L WITH(NOLOCK)
    LEFT JOIN [Master].[TblDestination] De WITH(NOLOCK) ON L.DestinationId = De.SlNo
    WHERE L.IsDelete = 0 
      AND CAST(L.LoadingDate AS DATE) = @Date
      AND L.ShiftId = @ShiftId
      AND L.MaterialId <> 7 -- Waste
    GROUP BY De.Name;

    -------------------------------------------------------------------
    -- SECTION F: CRUSHING DETAILS
    -------------------------------------------------------------------
    SELECT 
        C.SlNo,
        P.Name AS EquipmentName,
        C.RunningHr,
        C.TotalQty,
        0 AS Budget,
        C.TotalQty AS Actual
    FROM [Trans].[TblCrusher] C WITH(NOLOCK)
    LEFT JOIN [Master].[TblPlant] P WITH(NOLOCK) ON C.PlantId = P.SlNo
    WHERE C.Date = @Date AND C.ShiftId = @ShiftId;

    -------------------------------------------------------------------
    -- SECTION G: DEWATERING PUMP DETAILS
    -------------------------------------------------------------------
    SELECT 
        R.SlNo,
        E.EquipmentName AS Pump,
        ISNULL(R.NetHMR, R.CHMR - R.OHMR) AS RunHr
    FROM [Trans].[TblEquipmentReading] R WITH(NOLOCK)
    JOIN [Master].[TblEquipment] E WITH(NOLOCK) ON R.EquipmentId = E.SlNo
    WHERE Cast(R.Date as Date) = @Date 
      AND R.ShiftId = @ShiftId
      AND E.ActivityId = 10 -- Pump
      AND R.IsDelete = 0;

END

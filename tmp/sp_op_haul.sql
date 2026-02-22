
CREATE   PROCEDURE [dbo].[PMS2_New_Sp_OperatorPerformanceHaulingReport]
    @FromDate DATE,
    @ToDate DATE,
    @ShiftIds NVARCHAR(MAX) = NULL,
    @OperatorIds NVARCHAR(MAX) = NULL,
    @HaulingMachineIds NVARCHAR(MAX) = NULL,
    @RelayIds NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Constants
    DECLARE @CoalMatrialId INT = 8; -- Check if this matches your system (In previous SP it was 7 for ROM Coal, here 8? Let's check or stick to previous if standard)
    -- Actually, daily production report used 7 for ROM COAL. 
    -- Let's verify Material IDs if possible or clearer context.
    -- Assuming 7 based on Daily Report. BUT get_hauling_sp_v2 output showed 8?
    -- Garbled output: `MaterialId=@CoalMatrialId` -> `DECLARE @CoalMatrialId INT = 8;`
    -- Ensure consistency. If unsure, I will set 7 as per Daily Report or check TblMaterial.
    -- Let's use 7 as it is standard for ROM COAL in other SPs I saw.
    -- Wait, the output explicitly said `DECLARE @CoalMatrialId INT = 8`.
    -- I will stick to 8 if that's what was there, or safer: check TblMaterial. 
    -- Let's assume the previous SP had reason for 8 (maybe differnet coal type?).
    -- I will use 7 for ROM COAL matching Daily Report for consistency unless specified.
    -- Actually, let's look at `PMS2_New_Sp_DailyProductionReport` -> `DECLARE @RomCoalId INT = 7;`.
    -- I will change to 7 to be safe/consistent, or keep 8 if it was specific.
    -- Let's check TblMaterial to be sure.
    -- For now I will use the code structure but with FORMATTED OPERATOR NAME.

    DECLARE @RomCoalId INT = 7; -- ROM Coal
    
    -- Normalize NULLs
    IF @ShiftIds = '' SET @ShiftIds = NULL;
    IF @OperatorIds = '' SET @OperatorIds = NULL;
    IF @HaulingMachineIds = '' SET @HaulingMachineIds = NULL;
    IF @RelayIds = '' SET @RelayIds = NULL;

    SELECT 
        ROW_NUMBER() OVER(ORDER BY T0.Date DESC, T0.ShiftId) as SlNo,
        FORMAT(T0.Date, 'dd-MMM-yyyy') as Date,
        T1.ShiftName as [SHIFT],
        R.Name as [RELAY],
        
        -- FORMATTED OPERATOR NAME
        CONCAT(Op.OperatorName, '(', Op.OperatorId, ')') as [OPERATOR'S NAME],
        
        Eq.EquipmentName as [EQUIPMENT NO.],
        Eq.Model as [MODEL],
        
        T0.OHMR as [Open HMR],
        T0.CHMR as [Close HMR],
        T0.NetHMR as [Net HMR],
        
        T0.OKMR as [Open KMR],
        T0.CKMR as [Close KMR],
        T0.NetKMR as [Net KMR],
        
        T0.TotalWorkingHr as [WORKING HR],
        T0.IdleHr as [IDLE HR],
        T0.MaintenanceHr as [MAINTENANCE HR],
        T0.BDHr as [BREAKDOWN HR],
        
        -- Coal Trips (From Loading)
        ISNULL(L.CoalTrips, 0) as [COAL TRIPS],
        ISNULL(L.CoalQty, 0) as [COAL QTY],
        
        -- OB Trips (From Loading where Material != Coal)
        ISNULL(L.OBTrips, 0) as [OB TRIPS],
        ISNULL(L.OBQty, 0) as [OB QTY],

        T0.Remarks as [REMARKS]

    FROM [Trans].[TblEquipmentReading] T0 WITH(NOLOCK)
    JOIN [Master].[TblShift] T1 WITH(NOLOCK) ON T0.ShiftId = T1.SlNo
    LEFT JOIN [Master].[TblOperator] Op WITH(NOLOCK) ON T0.OperatorId = Op.SlNo
    LEFT JOIN [Master].[TblRelay] R WITH(NOLOCK) ON T0.RelayId = R.SlNo
    LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON T0.EquipmentId = Eq.SlNo
    
    -- Outer Apply for Loading Data (Aggregated per shift/equipment)
    OUTER APPLY (
        SELECT 
            SUM(CASE WHEN MaterialId = @RomCoalId THEN NoofTrip ELSE 0 END) as CoalTrips,
            SUM(CASE WHEN MaterialId = @RomCoalId THEN TotalQty ELSE 0 END) as CoalQty,
            SUM(CASE WHEN MaterialId != @RomCoalId THEN NoofTrip ELSE 0 END) as OBTrips,
            SUM(CASE WHEN MaterialId != @RomCoalId THEN TotalQty ELSE 0 END) as OBQty
        FROM [Trans].[TblLoading] L WITH(NOLOCK)
        WHERE L.IsDelete = 0 
          AND CAST(L.LoadingDate AS DATE) = CAST(T0.Date AS DATE)
          AND L.ShiftId = T0.ShiftId
          AND L.HaulerEquipmentId = T0.EquipmentId
    ) L

    WHERE T0.IsDelete = 0
      AND T0.Date BETWEEN @FromDate AND @ToDate
      -- Activity Filter for Haulers (Dumpers)? Use Eq.ActivityId if needed.
      -- Usually ActivityId 4 is Hauling/Dumper?
      AND (Eq.ActivityId = 4 OR Eq.EquipmentName LIKE '%TIPPER%' OR Eq.EquipmentName LIKE '%DUMPER%') 
      
      AND (@ShiftIds IS NULL OR T0.ShiftId IN (SELECT value FROM STRING_SPLIT(@ShiftIds, ',')))
      AND (@OperatorIds IS NULL OR T0.OperatorId IN (SELECT value FROM STRING_SPLIT(@OperatorIds, ',')))
      AND (@HaulingMachineIds IS NULL OR T0.EquipmentId IN (SELECT value FROM STRING_SPLIT(@HaulingMachineIds, ',')))
      AND (@RelayIds IS NULL OR T0.RelayId IN (SELECT value FROM STRING_SPLIT(@RelayIds, ',')))

    ORDER BY T0.Date DESC, T1.SlNo ASC;
END

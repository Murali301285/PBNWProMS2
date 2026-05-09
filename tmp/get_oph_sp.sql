ALTER PROCEDURE [dbo].[PMS2_New_Sp_OperatorPerformanceHaulingReport]
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
    DECLARE @CoalMatrialId INT = 7; 

    DECLARE @RomCoalId INT = 7; -- ROM Coal
    
    -- Normalize NULLs
    IF @ShiftIds = '' SET @ShiftIds = NULL;
    IF @OperatorIds = '' SET @OperatorIds = NULL;
    IF @HaulingMachineIds = '' SET @HaulingMachineIds = NULL;
    IF @RelayIds = '' SET @RelayIds = NULL;

    SELECT 
        ROW_NUMBER() OVER(ORDER BY T0.Date ASC, T0.ShiftId) as SlNo,
        FORMAT(T0.Date, 'dd-MMM-yyyy') as Date,
        T1.ShiftName as [SHIFT],
        R.Name as [RELAY],
        
        -- FORMATTED OPERATOR NAME
        CONCAT(Op.OperatorName, '-', Op.OperatorId, '') as [OPERATOR'S NAME],
        
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

        CASE WHEN T0.NetHMR > 0 THEN ROUND(((ISNULL(L.CoalTrips, 0) + ISNULL(L.OBTrips, 0)) / T0.NetHMR),2) ELSE 0 END AS [TOTAL TRIPS PER HR],
        CASE WHEN T0.NetHMR > 0 THEN ROUND(((ISNULL(L.CoalQty, 0) / 1.55) + ISNULL(L.OBQty, 0)) / T0.NetHMR,2) ELSE 0 END AS [TOTAL BCM/HR],

        O_Large.OperatorName as [Shift Incharge(Large Scale)],
        O_Mid.OperatorName as [Shift Incharge - Mid Scale],

        T0.Remarks as [REMARKS]

    FROM [Trans].[TblEquipmentReading] T0 WITH(NOLOCK)
    JOIN [Master].[TblShift] T1 WITH(NOLOCK) ON T0.ShiftId = T1.SlNo
    LEFT JOIN [Master].[TblOperator] Op WITH(NOLOCK) ON T0.OperatorId = Op.SlNo
    LEFT JOIN [Master].[TblRelay] R WITH(NOLOCK) ON T0.RelayId = R.SlNo
    LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON T0.EquipmentId = Eq.SlNo
    LEFT JOIN [Master].TblOperator O_Large WITH(NOLOCK) ON O_Large.SlNo = T0.ShiftInchargeId
    LEFT JOIN [Master].TblOperator O_Mid WITH(NOLOCK) ON O_Mid.SlNo = T0.MidScaleInchargeId
    
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
   
      AND (Eq.ActivityId = 4 ) 
      
      AND (@ShiftIds IS NULL OR T0.ShiftId IN (SELECT value FROM STRING_SPLIT(@ShiftIds, ',')))
      AND (@OperatorIds IS NULL OR T0.OperatorId IN (SELECT value FROM STRING_SPLIT(@OperatorIds, ',')))
      AND (@HaulingMachineIds IS NULL OR T0.EquipmentId IN (SELECT value FROM STRING_SPLIT(@HaulingMachineIds, ',')))
      AND (@RelayIds IS NULL OR T0.RelayId IN (SELECT value FROM STRING_SPLIT(@RelayIds, ',')))

ORDER BY T0.Date ASC, T1.SlNo ASC;
END

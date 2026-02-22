CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Sp_OperatorPerformanceLoadingReport]
    @FromDate DATE,
    @ToDate DATE,
    @ShiftIds NVARCHAR(MAX) = NULL,
    @OperatorIds NVARCHAR(MAX) = NULL,
    @LoadingMachineIds NVARCHAR(MAX) = NULL,
    @SectorIds NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ActivityId INT = 3; -- Loading
    DECLARE @ObMatrialId INT = 2; 
    DECLARE @CoalMatrialId INT = 7; 

    -- Normalize NULLs
    IF @ShiftIds = '' SET @ShiftIds = NULL;
    IF @OperatorIds = '' SET @OperatorIds = NULL;
    IF @LoadingMachineIds = '' SET @LoadingMachineIds = NULL;
    IF @SectorIds = '' SET @SectorIds = NULL;

    SELECT 
        ROW_NUMBER() OVER(ORDER BY T0.Date DESC, T0.ShiftId) as SlNo,
        FORMAT(T0.Date, 'dd-MMM-yyyy') as Date,
        
        CONCAT(Op.OperatorName, '(', Op.OperatorId, ')') as [OPERATOR'S NAME],
        
        T1.ShiftName as [SHIFT],
        Eq.EquipmentName as [LOADING EQUIPMENT],
        Eq.Model as [MODEL],
        S.SectorName as [SECTOR],
        R.Name as [RELAY],
        
        T0.OHMR as [Open HMR],
        T0.CHMR as [Close HMR],
        T0.NetHMR as [Net HMR],
        
        T0.TotalWorkingHr as [WORKING HR],
        T0.IdleHr as [IDLE HR],
        T0.MaintenanceHr as [MAINTENANCE HR],
        T0.BDHr as [BREAKDOWN HR],
        
        -- Coal Trips & Qty
        ISNULL(L.CoalTrips, 0) as [COAL TRIPS],
        ISNULL(L.CoalQty, 0) as [QUANTITY (MT)],
        
        -- Coal Calculations (Rounded Whole Numbers)
        CASE WHEN T0.NetHMR > 0 
             THEN CAST(ROUND(ISNULL(L.CoalTrips, 0) / T0.NetHMR, 0) AS INT) 
             ELSE 0 END as [COAL TRIPS/HR],
             
        CASE WHEN T0.NetHMR > 0 
             THEN CAST(ROUND(ISNULL(L.CoalQty, 0) / T0.NetHMR, 0) AS INT) 
             ELSE 0 END as [COAL QTY/HR],

        -- OB Trips & Qty
        ISNULL(L.OBTrips, 0) as [OB TRIPS],
        ISNULL(L.OBQty, 0) as [QUANTITY (BCM)],
        
        -- OB Calculations (Rounded Whole Numbers)
        CASE WHEN T0.NetHMR > 0 
             THEN CAST(ROUND(ISNULL(L.OBTrips, 0) / T0.NetHMR, 0) AS INT) 
             ELSE 0 END as [OB TRIPS/HR], -- Map to TRIP/HRS
             
        CASE WHEN T0.NetHMR > 0 
             THEN CAST(ROUND(ISNULL(L.OBQty, 0) / T0.NetHMR, 0) AS INT) 
             ELSE 0 END as [OB QTY/HR], -- Map to BCM/HRS

        O_Large.OperatorName as [Shift Incharge(Large Scale)],
        O_Mid.OperatorName as [Shift Incharge - Mid Scale],

        T0.Remarks as [REMARKS]

    FROM [Trans].[TblEquipmentReading] T0 WITH(NOLOCK)
    JOIN [Master].[TblShift] T1 WITH(NOLOCK) ON T0.ShiftId = T1.SlNo
    LEFT JOIN [Master].[TblOperator] Op WITH(NOLOCK) ON T0.OperatorId = Op.SlNo
    LEFT JOIN [Master].[TblSector] S WITH(NOLOCK) ON T0.SectorId = S.SlNo
    LEFT JOIN [Master].[TblRelay] R WITH(NOLOCK) ON T0.RelayId = R.SlNo 
    LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON T0.EquipmentId = Eq.SlNo
    
    -- Incharge Joins
    LEFT JOIN [Master].TblOperator O_Large WITH(NOLOCK) ON O_Large.SlNo = T0.ShiftInchargeId
    LEFT JOIN [Master].TblOperator O_Mid WITH(NOLOCK) ON O_Mid.SlNo = T0.MidScaleInchargeId
    
    OUTER APPLY (
        SELECT 
            SUM(CASE WHEN MaterialId != @CoalMatrialId THEN NoofTrip ELSE 0 END) as OBTrips,
            SUM(CASE WHEN MaterialId != @CoalMatrialId THEN TotalQty ELSE 0 END) as OBQty,
            SUM(CASE WHEN MaterialId = @CoalMatrialId THEN NoofTrip ELSE 0 END) as CoalTrips,
            SUM(CASE WHEN MaterialId = @CoalMatrialId THEN TotalQty ELSE 0 END) as CoalQty
        FROM [Trans].[TblLoading] L WITH(NOLOCK)
        WHERE L.IsDelete = 0 
          AND CAST(L.LoadingDate AS DATE) = CAST(T0.Date AS DATE)
          AND L.ShiftId = T0.ShiftId
          AND L.LoadingMachineEquipmentId = T0.EquipmentId
    ) L

    WHERE T0.IsDelete = 0
      AND T0.Date BETWEEN @FromDate AND @ToDate
      -- Include Only Loading (ActivityId 3)
      AND (Eq.ActivityId = @ActivityId)
      
      AND (@ShiftIds IS NULL OR T0.ShiftId IN (SELECT value FROM STRING_SPLIT(@ShiftIds, ',')))
      AND (@OperatorIds IS NULL OR T0.OperatorId IN (SELECT value FROM STRING_SPLIT(@OperatorIds, ',')))
      AND (@LoadingMachineIds IS NULL OR T0.EquipmentId IN (SELECT value FROM STRING_SPLIT(@LoadingMachineIds, ',')))
      AND (@SectorIds IS NULL OR T0.SectorId IN (SELECT value FROM STRING_SPLIT(@SectorIds, ',')))

    ORDER BY T0.Date DESC, T1.SlNo ASC;
END

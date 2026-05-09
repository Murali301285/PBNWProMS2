ALTER   PROCEDURE [dbo].[PMS2_New_Sp_LoadingMasterReport]
    @FromDate DATE,
    @ToDate DATE,
    @ShiftIds NVARCHAR(MAX) = NULL,
    @OperatorIds NVARCHAR(MAX) = NULL,
    @LoadingMachineIds NVARCHAR(MAX) = NULL,
    @LoadingModelIds NVARCHAR(MAX) = NULL, -- EquipmentGroupId
    @RelayIds NVARCHAR(MAX) = NULL,
    @SectorIds NVARCHAR(MAX) = NULL,
    @PatchIds NVARCHAR(MAX) = NULL,
    @MethodIds NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ActivityId INT = 4;        -- Exclude ActivityId 4
    DECLARE @ObMatrialId INT = 2;       -- OB Material ID
    DECLARE @CoalMatrialId INT = 7;     -- Coal Material ID

    -- Dynamic Conversion Factor Logic
    DECLARE @ConversionFactor DECIMAL(18,2);

    SELECT TOP 1 @ConversionFactor = Factor 
    FROM [Master].[TblConversionFactor] WITH(NOLOCK)
    WHERE @ToDate BETWEEN FromDate AND ToDate 
    AND IsActive = 1 AND IsDelete = 0
    ORDER BY FromDate DESC;

    IF @ConversionFactor IS NULL 
        SET @ConversionFactor = 1.55;

    -- Normalize Filters
    IF @ShiftIds = '' SET @ShiftIds = NULL;
    IF @OperatorIds = '' SET @OperatorIds = NULL;
    IF @LoadingMachineIds = '' SET @LoadingMachineIds = NULL;
    IF @LoadingModelIds = '' SET @LoadingModelIds = NULL;
    IF @RelayIds = '' SET @RelayIds = NULL;
    IF @SectorIds = '' SET @SectorIds = NULL;
    IF @PatchIds = '' SET @PatchIds = NULL;
    IF @MethodIds = '' SET @MethodIds = NULL;

    WITH MainData AS (
        SELECT 
            ROW_NUMBER() OVER(ORDER BY T0.Date ASC, T1.SlNo ASC) as SlNo,
            T2.CostCenter,
            format(t0.EquipmentId, '2000000') as PMSCode,
            FORMAT(T0.Date,'yyyy') as Year, 
            FORMAT(T0.Date,'MMMM-yy') as Month,
            FORMAT(T0.Date,'dd-MMM-yyyy') as Date,
            --Op.OperatorName as [Operator's Name],
			CONCAT(Op.OperatorName, '-', Op.OperatorId, '') as [Operator's Name],
            T1.ShiftName as Shift, 
            T2.EquipmentName as [Loading Machine],
            EG.Name as [Loading Model],
            T3.Name as Relay,
            T0.OHMR,
            T0.CHMR,
            T0.NetHMR as [Net HMR],
            ISNULL(T0.TotalWorkingHr, 0) as [Total Working Hr],
            
            -- Raw Trips and Qty for internal calc (names aliased for frontend usage as well)
            ISNULL(T7.OBTRIPS, 0) as [OB Trips],
            ISNULL(T7.QuantityBcm, 0) as [Quantity (BCM)],
            ISNULL(T8.CoalTrips, 0) as [Coal Trips],
            ISNULL(T8.QuantityMt, 0) as [Quantity (MT)],
            ISNULL(T10.RehandlingCoalTrips, 0) as [Coal Rehandling Trips],
            ISNULL(T9.RehandlingOBTRIPS, 0) as [OB Rehandling Trips],
            ISNULL(T11.RehandlingOtherTrips, 0) as [Other Rehandling Trips],
            
            -- Pre-calculate Denominator for Hours Distribution
            (ISNULL(T8.CoalTrips,0) + ISNULL(T7.OBTRIPS,0) + ISNULL(T9.RehandlingOBTRIPS,0) + ISNULL(T10.RehandlingCoalTrips,0) + ISNULL(T11.RehandlingOtherTrips,0)) as TotalTrips,

            T0.DevelopmentHrMining as [Development Hr (Mining)],
            T0.FaceMarchingHr as [Face Marching Hr],
            T0.DevelopmentHrNonMining as [Development Hr (Non-Mining)],
            T0.BlastingMarchingHr as [Blasting Marching Hr],
            T0.RunningBDMaintenanceHr as [Running BD/Maintenance Hr],
            T0.BDHr as [BD Hr.],
            T0.MaintenanceHr as [Maintenance Hr.],
            
            T4.SectorName as Sector,
            T5.Name as Patch,
            T6.Name as Method,
            T0.Remarks

        FROM [Trans].TblEquipmentReading T0 WITH(NOLOCK)
        JOIN [Master].TblShift T1 WITH(NOLOCK) on T1.SlNo=T0.ShiftId
        JOIN [Master].TblEquipment T2 WITH(NOLOCK) on T2.SlNo=T0.EquipmentId
        JOIN [Master].TblEquipmentGroup EG WITH(NOLOCK) on EG.SlNo=T2.EquipmentGroupId
        LEFT JOIN [Master].TblRelay T3 WITH(NOLOCK) on T3.SlNo=T0.RelayId
        LEFT JOIN [Master].TblSector T4 WITH(NOLOCK) on T4.SlNo=T0.SectorId
        LEFT JOIN [Master].TblPatch T5 WITH(NOLOCK) on T5.SlNo=T0.PatchId
        LEFT JOIN [Master].TblMethod T6 WITH(NOLOCK) on T6.SlNo=T0.MethodId
        LEFT JOIN [Master].TblOperator Op WITH(NOLOCK) ON Op.SlNo = T0.OperatorId

        OUTER APPLY (select SUM(NoofTrip) as OBTRIPS,SUM(TotalQty) as QuantityBcm  from [Trans].TblLoading where IsDelete=0 and MaterialId=@ObMatrialId and CONVERT(date,LoadingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T7
        OUTER APPLY (select SUM(NoofTrip) as CoalTrips,SUM(TotalQty) as QuantityMt  from [Trans].TblLoading where IsDelete=0 and MaterialId=@CoalMatrialId and CONVERT(date,LoadingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T8
        OUTER APPLY (select SUM(NoofTrip) as RehandlingOBTRIPS,SUM(TotalQty) as RehandlingOBQty  from [Trans].TblMaterialRehandling where IsDelete=0 and MaterialId=@ObMatrialId and CONVERT(date,RehandlingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T9
        OUTER APPLY (select SUM(NoofTrip) as RehandlingCoalTrips,SUM(TotalQty) as RehandlingCoalQty  from [Trans].TblMaterialRehandling where IsDelete=0 and MaterialId=@CoalMatrialId and CONVERT(date,RehandlingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T10
        OUTER APPLY (select SUM(NoofTrip) as RehandlingOtherTrips,SUM(TotalQty) as RehandlingOtherQty  from [Trans].TblMaterialRehandling where IsDelete=0 and MaterialId not  in (@ObMatrialId,@CoalMatrialId) and CONVERT(date,RehandlingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T11
        
        WHERE T0.IsDelete=0 AND T0.ActivityId <> @ActivityId
        AND (CONVERT(date,T0.Date) BETWEEN @FromDate AND @ToDate)
        -- Dynamic Filters
        AND (@ShiftIds IS NULL OR T0.ShiftId IN (SELECT value FROM STRING_SPLIT(@ShiftIds, ',')))
        AND (@OperatorIds IS NULL OR T0.OperatorId IN (SELECT value FROM STRING_SPLIT(@OperatorIds, ',')))
        AND (@LoadingMachineIds IS NULL OR T0.EquipmentId IN (SELECT value FROM STRING_SPLIT(@LoadingMachineIds, ',')))
        AND (@LoadingModelIds IS NULL OR T2.EquipmentGroupId IN (SELECT value FROM STRING_SPLIT(@LoadingModelIds, ',')))
        AND (@RelayIds IS NULL OR T0.RelayId IN (SELECT value FROM STRING_SPLIT(@RelayIds, ',')))
        AND (@SectorIds IS NULL OR T0.SectorId IN (SELECT value FROM STRING_SPLIT(@SectorIds, ',')))
        AND (@PatchIds IS NULL OR T0.PatchId IN (SELECT value FROM STRING_SPLIT(@PatchIds, ',')))
        AND (@MethodIds IS NULL OR T0.MethodId IN (SELECT value FROM STRING_SPLIT(@MethodIds, ',')))
    ),
    CalculatedHours AS (
        SELECT *,
            -- Hours Distribution Logic
            CASE WHEN TotalTrips > 0 THEN ([Total Working Hr] / TotalTrips) * [Coal Trips] ELSE 0 END as CoalHrsVal,
            CASE WHEN TotalTrips > 0 THEN ([Total Working Hr] / TotalTrips) * [OB Trips] ELSE 0 END as OBHrsVal, 
            CASE WHEN TotalTrips > 0 THEN ([Total Working Hr] / TotalTrips) * [Coal Rehandling Trips] ELSE 0 END as CoalRehandlingHrsVal,
            CASE WHEN TotalTrips > 0 THEN ([Total Working Hr] / TotalTrips) * [OB Rehandling Trips] ELSE 0 END as OBRehandlingHrsVal
        FROM MainData
    )
    SELECT 
        SlNo, CostCenter, PMSCode, Year, Month, Date, [Operator's Name], Shift, [Loading Machine], [Loading Model], Relay, 
        OHMR, CHMR, [Net HMR], [Total Working Hr],

        -- Formatted Hours
        FORMAT(CoalHrsVal, '0.00') as [Coal Hrs],
        FORMAT(OBHrsVal, '0.00') as [OB Hrs],
        FORMAT(CoalRehandlingHrsVal, '0.00') as [Coal Rehandling Hrs],
        FORMAT(OBRehandlingHrsVal, '0.00') as [OB Rehandling Hrs],

        [OB Trips], [Quantity (BCM)], [Coal Trips], [Quantity (MT)],

        -- Calculated Metrics
 FORMAT(
            CASE WHEN (CoalHrsVal + OBHrsVal) = 0 THEN 0.00
            ELSE ([OB Trips] + [Coal Trips]) / (CoalHrsVal + OBHrsVal)
            END, '0.00'
        ) AS [Trip/Hrs],

        FORMAT(
            CASE WHEN [Total Working Hr] = 0 THEN 0.00
            ELSE ([Quantity (BCM)] + ([Quantity (MT)] / @ConversionFactor)) / [Total Working Hr]
            END, '0.00'
        ) AS [BCM/Hrs],

        [Development Hr (Mining)], [Face Marching Hr], [Development Hr (Non-Mining)], [Blasting Marching Hr], 
        [Running BD/Maintenance Hr], [BD Hr.], [Maintenance Hr.],
        [Coal Rehandling Trips], [OB Rehandling Trips], [Other Rehandling Trips],
        Sector, Patch, Method, Remarks,

        -- EXTRA COLUMN FOR FRONTEND
        @ConversionFactor as ConversionFactor

    FROM CalculatedHours
    ORDER BY CAST(Date AS DATE) ASC, Shift ASC
END

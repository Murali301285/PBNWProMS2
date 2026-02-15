CREATE   PROCEDURE [dbo].[PMS2_New_Sp_LoadingMasterReport]
    @FromDate DATE,
    @ToDate DATE,
    @ShiftIds NVARCHAR(MAX) = NULL,
    @OperatorIds NVARCHAR(MAX) = NULL,
    @LoadingMachineIds NVARCHAR(MAX) = NULL,
    @LoadingModelIds NVARCHAR(MAX) = NULL, -- EquipmentGroupId for Loaders
    @RelayIds NVARCHAR(MAX) = NULL,
    @SectorIds NVARCHAR(MAX) = NULL,
    @PatchIds NVARCHAR(MAX) = NULL,
    @MethodIds NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ActivityId INT = 4; -- ActivityId to exclude (from original query: T0.ActivityId != 4)
    DECLARE @ObMatrialId INT = 1; 
    DECLARE @CoalMatrialId INT = 8;

    -- Normalize NULLs
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
            T0.SlNo,
            T2.CostCenter,
            format(t0.EquipmentId, '2000000') as PMSCode,
            FORMAT(T0.Date,'yyyy') as Year, 
            FORMAT(T0.Date,'MMMM-yy') as Month,
            FORMAT(T0.Date,'dd-MMM-yy') as Date,
            -- dbo.GetOperatorName(T0.SlNo,'EquipmentReading') as [Operator's Name], -- Original
            Op.OperatorName as [Operator's Name], -- Optimized Join if OperatorId exists
            T1.ShiftName as Shift, 
            T2.EquipmentName as [Loading Machine],
            EG.Name as [Loading Model],
            T3.Name as Relay,
            T0.OHMR,
            T0.CHMR,
            T0.NetHMR as [Net HMR],
            T0.TotalWorkingHr as [Total Working Hr],
            
            FORMAT(CASE WHEN ISNULL(T8.CoalTrips,0.00)>0 THEN (ISNULL(T0.TotalWorkingHr,0.00)/(ISNULL(T8.CoalTrips,0.00)+ISNULL(T7.OBTRIPS,0.00)+ISNULL(T9.RehandlingOBTRIPS,0.00)+ISNULL(T10.RehandlingCoalTrips,0.00)+ISNULL(T11.RehandlingOtherTrips,0.00))*ISNULL(T8.CoalTrips,0.00)) ELSE 0.00 END,'0.00') as [Coal Hrs],
            FORMAT(CASE WHEN ISNULL(T7.OBTRIPS,0.00)>0 THEN (ISNULL(T0.TotalWorkingHr,0.00)/(ISNULL(T8.CoalTrips,0.00)+ISNULL(T7.OBTRIPS,0.00)+ISNULL(T9.RehandlingOBTRIPS,0.00)+ISNULL(T10.RehandlingCoalTrips,0.00)+ISNULL(T11.RehandlingOtherTrips,0.00))*ISNULL(T7.OBTRIPS,0.00)) ELSE 0.00 END,'0.00') as [OB Hrs],
            
            FORMAT(CASE WHEN ISNULL(T10.RehandlingCoalTrips,0.00)>0 THEN (ISNULL(T0.TotalWorkingHr,0.00)/(ISNULL(T8.CoalTrips,0.00)+ISNULL(T7.OBTRIPS,0.00)+ISNULL(T9.RehandlingOBTRIPS,0.00)+ISNULL(T10.RehandlingCoalTrips,0.00)+ISNULL(T11.RehandlingOtherTrips,0.00))*ISNULL(T10.RehandlingCoalTrips,0.00)) ELSE 0.00 END,'0.00') as [Coal Rehandling Hrs],
            FORMAT(CASE WHEN ISNULL(T9.RehandlingOBTRIPS,0.00)>0 THEN (ISNULL(T0.TotalWorkingHr,0.00)/(ISNULL(T8.CoalTrips,0.00)+ISNULL(T7.OBTRIPS,0.00)+ISNULL(T9.RehandlingOBTRIPS,0.00)+ISNULL(T10.RehandlingCoalTrips,0.00)+ISNULL(T11.RehandlingOtherTrips,0.00))*ISNULL(T9.RehandlingOBTRIPS,0.00)) ELSE 0.00 END,'0.00') as [OB Rehandling Hrs],
            
            ISNULL(T7.OBTRIPS,0.00) as [OB Trips],
            ISNULL(T7.QuantityBcm,0.00) as [Quantity (BCM)],
            ISNULL(T8.CoalTrips,0.00) as [Coal Trips],
            ISNULL(T8.QuantityMt,0.00) as [Quantity (MT)],
            
            NULL as [Trip/Hrs],
            NULL as [BCM/Hrs],

            T0.DevelopmentHrMining as [Development Hr (Mining)],
            T0.FaceMarchingHr as [Face Marching Hr],
            T0.DevelopmentHrNonMining as [Development Hr (Non-Mining)],
            T0.BlastingMarchingHr as [Blasting Marching Hr],
            T0.RunningBDMaintenanceHr as [Running BD/Maintenance Hr],
            T0.BDHr as [BD Hr.],
            T0.MaintenanceHr as [Maintenance Hr.],
            
            ISNULL(T10.RehandlingCoalTrips,0.00) as [Coal Rehandling Trips],
            ISNULL(T9.RehandlingOBTRIPS,0.00) as [OB Rehandling Trips],
            ISNULL(T11.RehandlingOtherTrips,0.00) as [Other Rehandling Trips],

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
        LEFT JOIN [Master].TblOperator Op WITH(NOLOCK) ON Op.SlNo = T0.OperatorId  -- Assuming OperatorId exists based on similar tables

        OUTER APPLY (select SUM(NoofTrip) as OBTRIPS,SUM(TotalQty) as QuantityBcm  from [Trans].TblLoading where IsDelete=0 and MaterialId=@ObMatrialId and CONVERT(date,LoadingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T7
        OUTER APPLY (select SUM(NoofTrip) as CoalTrips,SUM(TotalQty) as QuantityMt  from [Trans].TblLoading where IsDelete=0 and MaterialId=@CoalMatrialId and CONVERT(date,LoadingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T8
        OUTER APPLY (select SUM(NoofTrip) as RehandlingOBTRIPS,SUM(TotalQty) as RehandlingOBQty  from [Trans].TblMaterialRehandling where IsDelete=0 and MaterialId=@ObMatrialId and CONVERT(date,RehandlingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T9
        OUTER APPLY (select SUM(NoofTrip) as RehandlingCoalTrips,SUM(TotalQty) as RehandlingCoalQty  from [Trans].TblMaterialRehandling where IsDelete=0 and MaterialId=@CoalMatrialId and CONVERT(date,RehandlingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T10
        OUTER APPLY (select SUM(NoofTrip) as RehandlingOtherTrips,SUM(TotalQty) as RehandlingOtherQty  from [Trans].TblMaterialRehandling where IsDelete=0 and MaterialId not  in (@ObMatrialId,@CoalMatrialId) and CONVERT(date,RehandlingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T11
        
        WHERE T0.IsDelete=0 AND T0.ActivityId != @ActivityId
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

    )
    SELECT * FROM MainData ORDER BY Date DESC
END


CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Sp_HaulingMasterReport]
(
    @fromDateInput DATE,
    @toDateInput DATE,
    @shiftIds NVARCHAR(MAX) = NULL,
    @operatorIds NVARCHAR(MAX) = NULL,
    @haulerIds NVARCHAR(MAX) = NULL,
    @haulerModelIds NVARCHAR(MAX) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @FromDate DATE = @fromDateInput;
    DECLARE @ToDate DATE = @toDateInput;

    -- Helper Tables for filters
    DECLARE @ShiftTbl TABLE (Id INT);
    IF @shiftIds IS NOT NULL AND @shiftIds <> ''
        INSERT INTO @ShiftTbl SELECT value FROM STRING_SPLIT(@shiftIds, ',');

    DECLARE @OperatorTbl TABLE (Id INT);
    IF @operatorIds IS NOT NULL AND @operatorIds <> ''
        INSERT INTO @OperatorTbl SELECT value FROM STRING_SPLIT(@operatorIds, ',');

    DECLARE @HaulerTbl TABLE (Id INT);
    IF @haulerIds IS NOT NULL AND @haulerIds <> ''
        INSERT INTO @HaulerTbl SELECT value FROM STRING_SPLIT(@haulerIds, ',');

    DECLARE @HaulerModelTbl TABLE (Id INT);
    IF @haulerModelIds IS NOT NULL AND @haulerModelIds <> ''
        INSERT INTO @HaulerModelTbl SELECT value FROM STRING_SPLIT(@haulerModelIds, ',');
    
    DECLARE @ActivityId INT = 4;
    DECLARE @ObMatrialId INT = 2;
    DECLARE @CoalMatrialId INT = 7;

    -- Dynamic Conversion Factor Logic
    DECLARE @ConversionFactor DECIMAL(18,2);

    SELECT TOP 1 @ConversionFactor = Factor 
    FROM [Master].[TblConversionFactor] WITH(NOLOCK)
    WHERE @ToDate BETWEEN FromDate AND ToDate 
    AND IsActive = 1 AND IsDelete = 0
    ORDER BY FromDate DESC;

    IF @ConversionFactor IS NULL 
        SET @ConversionFactor = 1.55;

    WITH MainData AS (
        SELECT 
            T0.SlNo,
            T2.CostCenter,
            format(t0.EquipmentId, '2000000') as ProdsysCode,
            FORMAT(T0.Date,'yyyy') as Year, 
            FORMAT(T0.Date,'MMMM-yy') as Month,
            FORMAT(T0.Date,'dd-MMM-yy') as Date,
            T0.Date as MainDate,
            Op.OperatorName as Operator,
            T1.ShiftName, 
            T2.EquipmentName as Equipment,
            EG.Name as EquipmentModel,
            T3.Name as Relay,
            T0.OHMR,
            T0.CHMR,
            T0.NetHMR,
            ISNULL(T0.TotalWorkingHr,0.00) as TotalWorkingHr,

            -- Logic for distributing hours (same as original SP, just re-formatted for clarity/maintenance if needed, but keeping logic as is)
             FORMAT(CASE WHEN ISNULL(T8.CoalTrips,0.00)>0 THEN (ISNULL(T0.TotalWorkingHr,0.00)/(ISNULL(T8.CoalTrips,0.00)+ISNULL(T7.OBTRIPS,0.00)+ISNULL(T9.RehandlingOBTRIPS,0.00)+ISNULL(T10.RehandlingCoalTrips,0.00)+ISNULL(T11.RehandlingOtherTrips,0.00))*ISNULL(T8.CoalTrips,0.00)) ELSE 0.00 END,'0.00') as CoalHrs,
             FORMAT(CASE WHEN ISNULL(T7.OBTRIPS,0.00)>0 THEN (ISNULL(T0.TotalWorkingHr,0.00)/(ISNULL(T8.CoalTrips,0.00)+ISNULL(T7.OBTRIPS,0.00)+ISNULL(T9.RehandlingOBTRIPS,0.00)+ISNULL(T10.RehandlingCoalTrips,0.00)+ISNULL(T11.RehandlingOtherTrips,0.00))*ISNULL(T7.OBTRIPS,0.00)) ELSE 0.00 END,'0.00') as OBHrs,
            
             FORMAT(CASE WHEN ISNULL(T10.RehandlingCoalTrips,0.00)>0 THEN (ISNULL(T0.TotalWorkingHr,0.00)/(ISNULL(T8.CoalTrips,0.00)+ISNULL(T7.OBTRIPS,0.00)+ISNULL(T9.RehandlingOBTRIPS,0.00)+ISNULL(T10.RehandlingCoalTrips,0.00)+ISNULL(T11.RehandlingOtherTrips,0.00))*ISNULL(T10.RehandlingCoalTrips,0.00)) ELSE 0.00 END,'0.00') as MainCoalRehandlingHrs,
             FORMAT(CASE WHEN ISNULL(T9.RehandlingOBTRIPS,0.00)>0 THEN (ISNULL(T0.TotalWorkingHr,0.00)/(ISNULL(T8.CoalTrips,0.00)+ISNULL(T7.OBTRIPS,0.00)+ISNULL(T9.RehandlingOBTRIPS,0.00)+ISNULL(T10.RehandlingCoalTrips,0.00)+ISNULL(T11.RehandlingOtherTrips,0.00))*ISNULL(T9.RehandlingOBTRIPS,0.00)) ELSE 0.00 END,'0.00') as MainOBRehandlingHrs,

            ISNULL(T7.OBTRIPS,0.00) as OBTRIPS,
            ISNULL(T7.QuantityBcm,0.00) as QuantityBcm,
            ISNULL(T8.CoalTrips,0.00) as CoalTrips,
            ISNULL(T8.QuantityMt,0.00) as QuantityMt,
            
            T0.OKMR,
            T0.CKMR,
            T0.NetKMR,
            
            ISNULL(T10.RehandlingCoalTrips,0.00) as RehandlingCoalTrips,
            ISNULL(T10.RehandlingCoalQty,0.00) as RehandlingCoalQty,
            ISNULL(T9.RehandlingOBTRIPS,0.00) as RehandlingOBTRIPS,
            ISNULL(T9.RehandlingOBQty,0.00) as RehandlingOBQty,
            ISNULL(T11.RehandlingOtherTrips,0.00) as RehandlingOtherTrips,
            ISNULL(T11.RehandlingOtherQty,0.00) as RehandlingOtherQty,
            
            '' as Speed,
            '' as RouteLength,
            '' as strLead,
            T0.Remarks,
            T0.DevelopmentHrMining, 
            T0.FaceMarchingHr,
            T0.DevelopmentHrNonMining,
            T0.BlastingMarchingHr,
            T0.RunningBDMaintenanceHr,
            T0.BDHr,
            T0.MaintenanceHr

        FROM [Trans].TblEquipmentReading T0 WITH(NOLOCK)
        JOIN [Master].TblShift T1 WITH(NOLOCK) on T1.SlNo=T0.ShiftId
        JOIN [Master].TblEquipment T2 WITH(NOLOCK) on T2.SlNo=T0.EquipmentId
        JOIN [Master].TblEquipmentGroup EG WITH(NOLOCK) on EG.SlNo=T2.EquipmentGroupId
        LEFT JOIN [Master].TblRelay T3 WITH(NOLOCK) on T3.SlNo=T0.RelayId
        LEFT JOIN [Master].TblSector T4 WITH(NOLOCK) on T4.SlNo=T0.SectorId
        LEFT JOIN [Master].TblPatch T5 WITH(NOLOCK) on T5.SlNo=T0.PatchId
        LEFT JOIN [Master].TblMethod T6 WITH(NOLOCK) on T6.SlNo=T0.MethodId
        LEFT JOIN [Master].TblOperator Op WITH(NOLOCK) ON Op.SlNo = T0.OperatorId

        OUTER APPLY (select SUM(NoofTrip) as OBTRIPS,SUM(TotalQty) as QuantityBcm  from [Trans].TblLoading where IsDelete=0 and MaterialId=@ObMatrialId and CONVERT(date,LoadingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and HaulerEquipmentId=T0.EquipmentId) as T7
        OUTER APPLY (select SUM(NoofTrip) as CoalTrips,SUM(TotalQty) as QuantityMt  from [Trans].TblLoading where IsDelete=0 and MaterialId=@CoalMatrialId and CONVERT(date,LoadingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and HaulerEquipmentId=T0.EquipmentId) as T8
        OUTER APPLY (select SUM(NoofTrip) as RehandlingOBTRIPS,SUM(TotalQty) as RehandlingOBQty  from [Trans].TblMaterialRehandling where IsDelete=0 and MaterialId=@ObMatrialId and CONVERT(date,RehandlingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and HaulerEquipmentId=T0.EquipmentId) as T9
        OUTER APPLY (select SUM(NoofTrip) as RehandlingCoalTrips,SUM(TotalQty) as RehandlingCoalQty  from [Trans].TblMaterialRehandling where IsDelete=0 and MaterialId=@CoalMatrialId and CONVERT(date,RehandlingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and HaulerEquipmentId=T0.EquipmentId) as T10
        OUTER APPLY (select SUM(NoofTrip) as RehandlingOtherTrips,SUM(TotalQty) as RehandlingOtherQty  from [Trans].TblMaterialRehandling where IsDelete=0 and MaterialId not  in (@ObMatrialId,@CoalMatrialId) and CONVERT(date,RehandlingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and HaulerEquipmentId=T0.EquipmentId) as T11
        
        WHERE T0.IsDelete=0 and T0.ActivityId=@ActivityId
        AND (CONVERT(date,T0.Date) BETWEEN @FromDate AND @ToDate)
        
        -- Dynamic Filters
        AND (@shiftIds IS NULL OR @shiftIds = '' OR T0.ShiftId IN (SELECT Id FROM @ShiftTbl))
        AND (@operatorIds IS NULL OR @operatorIds = '' OR T0.OperatorId IN (SELECT Id FROM @OperatorTbl))
        AND (@haulerIds IS NULL OR @haulerIds = '' OR T0.EquipmentId IN (SELECT Id FROM @HaulerTbl))
        AND (@haulerModelIds IS NULL OR @haulerModelIds = '' OR T2.EquipmentGroupId IN (SELECT Id FROM @HaulerModelTbl))
    )
    SELECT 
        SlNo as [Sl.No],
        CostCenter as [Cost Center],
        ProdsysCode as [PMS Code],
        Year, Month, Date,
        Operator as [Operator's Name],
        ShiftName as [Shift],
        Equipment as [Hauler],
        EquipmentModel as [Hauling Model],
        Relay, OHMR, CHMR, NetHMR as [Net HMR], TotalWorkingHr as [Total Working Hr],
        CoalHrs as [Coal Hrs],
        OBHrs as [OB Hrs],
        MainCoalRehandlingHrs as [Coal Rehandling Hrs],
        MainOBRehandlingHrs as [OB Rehandling Hrs],
        OBTRIPS as [OB Trips],
        QuantityBcm as [Quantity (BCM)],
        CoalTrips as [Coal Trips],
        QuantityMt as [Quantity (MT)],
        OKMR, CKMR, NetKMR as [Net KMR],
        FORMAT(CASE WHEN (CAST(OBHrs AS FLOAT) + CAST(CoalHrs AS FLOAT)) = 0 THEN 0.00
            ELSE (CAST(OBTRIPS AS FLOAT) + CAST(CoalTrips AS FLOAT)) / NULLIF((CAST(CoalHrs AS FLOAT) + CAST(OBHrs AS FLOAT)), 0)
        END, '0.00') AS [Trip/Hrs],
        
        FORMAT(CASE WHEN (CAST(CoalHrs AS FLOAT) + CAST(OBHrs AS FLOAT)) = 0 THEN 0.00
            ELSE (CAST(QuantityBcm AS FLOAT) + (CAST(QuantityMt AS FLOAT) / @ConversionFactor)) / NULLIF(CAST(TotalWorkingHr AS FLOAT), 0)
        END, '0.00') AS [BCM/Hrs],

        RehandlingCoalTrips as [Coal Rehandling Trips],
        RehandlingCoalQty as [Coal Rehandling Qty],
        RehandlingOBTRIPS as [OB Rehandling Trips],
        RehandlingOBQty as [OB Rehandling Qty],
        RehandlingOtherTrips as [Other Rehandling Trips],
        RehandlingOtherQty as [Other Rehandling Qty],
        Speed, RouteLength as [Route Length], strLead as [Lead], Remarks,

        -- Extra Columns
        @ConversionFactor as ConversionFactor

    FROM MainData
    ORDER BY MainDate, ShiftName ASC;
END

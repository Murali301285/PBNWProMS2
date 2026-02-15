
CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Sp_OperatorPerformanceHaulingReport]
    @FromDate DATE,
    @ToDate DATE,
    @ShiftIds NVARCHAR(MAX) = NULL,
    @OperatorIds NVARCHAR(MAX) = NULL,
    @HaulingMachineIds NVARCHAR(MAX) = NULL,
    @RelayIds NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ActivityId INT = 4; -- Exclude activity if needed, similar to Loading
    DECLARE @ObMatrialId INT = 1;
    DECLARE @CoalMatrialId INT = 8;

    -- Normalize NULLs
    IF @ShiftIds = '' SET @ShiftIds = NULL;
    IF @OperatorIds = '' SET @OperatorIds = NULL;
    IF @HaulingMachineIds = '' SET @HaulingMachineIds = NULL;
    IF @RelayIds = '' SET @RelayIds = NULL;

    -- Main Data CTE
    WITH MainData AS (
        SELECT 
            ROW_NUMBER() OVER(ORDER BY T0.Date DESC, T0.ShiftId) as SlNo,
            T0.Date,
            Op.OperatorName as [OPERATOR'S NAME],
            T1.ShiftName as [SHIFT],
            T2.EquipmentName as [Hauling Equipment.],
            EG.Name as [Equipment.MODEL],
            T3.Name as [RELAY],
            
            T0.OHMR as [Open HMR],
            T0.CHMR as [CLOSE HMR],
            T0.NetHMR as [Net HMR],
            
            ISNULL(T7.OBTRIPS, 0) as [OB TRIPS],
            ISNULL(T7.QuantityBcm, 0) as [QUANTITY (BCM)],
            
            ISNULL(T8.CoalTrips, 0) as [COAL TRIPS],
            ISNULL(T8.QuantityMt, 0) as [QUANTITY (MT)],
            
            T0.OKMR,
            T0.CKMR,
            T0.NetKMR as [Net KMR],

            -- Productivity: Trip/Hrs
            CASE WHEN ISNULL(T0.NetHMR, 0) > 0 
                 THEN CAST((ISNULL(T7.OBTRIPS, 0) + ISNULL(T8.CoalTrips, 0)) / T0.NetHMR AS DECIMAL(10, 2))
                 ELSE 0 END as [TRIP/HRS],
                 
            -- Productivity: BCM/Hrs (Note: Coal MT converted to BCM-equivalent or just raw sum? 
            -- Loading report uses different logic. Here user asked for BCM/HRS. 
            -- Assuming BCM + (MT/Factor) or just BCM? 
            -- Existing Hauling Master uses: (QtyBcm + (QtyMt / 1.55)) / WorkingHr. 
            -- I will use similar logic if possible or just BCM for now to be safe, or just sum if factor unknown.
            -- Let's stick to BCM only for "BCM/HRS" unless "Total Material" requested. 
            -- User just asked "BCM/HRS". I will output BCM / NetHMR.)
            CASE WHEN ISNULL(T0.NetHMR, 0) > 0 
                 THEN CAST(ISNULL(T7.QuantityBcm, 0) / T0.NetHMR AS DECIMAL(10, 2))
                 ELSE 0 END as [BCM/HRS],

            -- Total Trips
            (ISNULL(T7.OBTRIPS, 0) + ISNULL(T8.CoalTrips, 0)) as [Total Trip],

            NULL as [Mapio Name],
            EG.Name as [Model], -- Duplicate of Equipment.MODEL as requested
            
            -- Speed
            CASE WHEN ISNULL(T0.NetHMR, 0) > 0 
                 THEN CAST(T0.NetKMR / T0.NetHMR AS DECIMAL(10, 2))
                 ELSE 0 END as [Speed],
                 
            NULL as [Lead],

            O_Large.OperatorName as [Shift Incharge(Large Scale)],
            O_Mid.OperatorName as [Shift Incharge - Mid Scale]

        FROM [Trans].TblEquipmentReading T0 WITH(NOLOCK)
        JOIN [Master].TblShift T1 WITH(NOLOCK) on T1.SlNo=T0.ShiftId
        JOIN [Master].TblEquipment T2 WITH(NOLOCK) on T2.SlNo=T0.EquipmentId
        LEFT JOIN [Master].TblEquipmentGroup EG WITH(NOLOCK) on EG.SlNo=T2.EquipmentGroupId
        LEFT JOIN [Master].TblRelay T3 WITH(NOLOCK) on T3.SlNo=T0.RelayId
        LEFT JOIN [Master].TblOperator Op WITH(NOLOCK) ON Op.SlNo = T0.OperatorId
        
        -- Incharge Joins
        LEFT JOIN [Master].TblOperator O_Large WITH(NOLOCK) ON O_Large.SlNo = T0.ShiftInchargeId
        LEFT JOIN [Master].TblOperator O_Mid WITH(NOLOCK) ON O_Mid.SlNo = T0.MidScaleInchargeId
        
        -- Logic for Trips/Qty JOINED ON HaulerEquipmentId
        OUTER APPLY (select SUM(NoofTrip) as OBTRIPS,SUM(TotalQty) as QuantityBcm  from [Trans].TblLoading where IsDelete=0 and MaterialId=@ObMatrialId and CONVERT(date,LoadingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and HaulerEquipmentId=T0.EquipmentId) as T7
        OUTER APPLY (select SUM(NoofTrip) as CoalTrips,SUM(TotalQty) as QuantityMt  from [Trans].TblLoading where IsDelete=0 and MaterialId=@CoalMatrialId and CONVERT(date,LoadingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and HaulerEquipmentId=T0.EquipmentId) as T8
        
        WHERE T0.IsDelete=0 
        -- AND T0.ActivityId != @ActivityId -- Activity logic might differ for Haulers. Use if standard.
        AND (CONVERT(date,T0.Date) BETWEEN @FromDate AND @ToDate)
        
        -- Filters
        AND (@ShiftIds IS NULL OR T0.ShiftId IN (SELECT value FROM STRING_SPLIT(@ShiftIds, ',')))
        AND (@OperatorIds IS NULL OR T0.OperatorId IN (SELECT value FROM STRING_SPLIT(@OperatorIds, ',')))
        AND (@HaulingMachineIds IS NULL OR T0.EquipmentId IN (SELECT value FROM STRING_SPLIT(@HaulingMachineIds, ',')))
        AND (@RelayIds IS NULL OR T0.RelayId IN (SELECT value FROM STRING_SPLIT(@RelayIds, ',')))
    )

    SELECT * FROM MainData ORDER BY Date DESC, [SHIFT] ASC
END

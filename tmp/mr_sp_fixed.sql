ALTER   PROCEDURE [dbo].[PMS2_New_Sp_MaterialRehandlingReport]
    @FromDate DATE,
    @ToDate DATE,
    @ShiftIds NVARCHAR(MAX) = NULL,
    @SourceIds NVARCHAR(MAX) = NULL,
    @DestinationIds NVARCHAR(MAX) = NULL,
    @HaulerIds NVARCHAR(MAX) = NULL,
    @LoadingMachineIds NVARCHAR(MAX) = NULL,
    @MaterialIds NVARCHAR(MAX) = NULL,
    @RelayIds NVARCHAR(MAX) = NULL,
    @ScaleIds NVARCHAR(MAX) = NULL,
    @SectorIds NVARCHAR(MAX) = NULL,
    @PatchIds NVARCHAR(MAX) = NULL,
    @ShiftInchargeIds NVARCHAR(MAX) = NULL,    -- Renamed from InchargeIds (Large Scale)
    @MidScaleInchargeIds NVARCHAR(MAX) = NULL  -- Added Mid Scale
AS
BEGIN
    SET NOCOUNT ON;

    -- Normalize Empty Strings to NULL
    IF @ShiftIds = '' SET @ShiftIds = NULL;
    IF @SourceIds = '' SET @SourceIds = NULL;
    IF @DestinationIds = '' SET @DestinationIds = NULL;
    IF @HaulerIds = '' SET @HaulerIds = NULL;
    IF @LoadingMachineIds = '' SET @LoadingMachineIds = NULL;
    IF @MaterialIds = '' SET @MaterialIds = NULL;
    IF @RelayIds = '' SET @RelayIds = NULL;
    IF @ScaleIds = '' SET @ScaleIds = NULL;
    IF @SectorIds = '' SET @SectorIds = NULL;
    IF @PatchIds = '' SET @PatchIds = NULL;
    IF @ShiftInchargeIds = '' SET @ShiftInchargeIds = NULL;
    IF @MidScaleInchargeIds = '' SET @MidScaleInchargeIds = NULL;

    SELECT 
        T0.SlNo, 
        FORMAT(T0.RehandlingDate,'yyyy') as Year, 
        FORMAT(T0.RehandlingDate,'MMMM-yy') as Month,
        FORMAT(T0.RehandlingDate,'dd-MMM-yyyy') as Date,
        T1.ShiftName,
        T2.Name as SourceName,
        T3.Name as Destination,
        T4.CostCenter as CostCenterHauler,
        format(T0.HaulerEquipmentId, '2000000') as ProdsysCodeHauling,
        T4.EquipmentName as HaulerEquipment,
        T5.CostCenter as CostCenterLoading,
        format(T0.LoadingMachineEquipmentId, '2000000') as ProdsysCodeLoading,
        T5.EquipmentName as LoadingMachine,
        T6.MaterialName,
        T0.NtpcQtyTrip,
        T0.QtyTrip as ManagQtyTrip,
        '' as TripNtpc,
        T0.NoofTrip as TripManagement,
        T0.TotalQty as ManagTotalQty,
        T0.TotalNtpcQty,
        T10.Name as LoadingModel,
        T9.Name as HaulingModel,
        T7.Name as ScaleName,
        T12.SectorName as Sector,
        T13.Name as Patch,
        T8.Name as Relay,
        T0.Remarks,
        OpLarge.OperatorName as ShiftInchargeLarge,
        OpMid.OperatorName as ShiftInchargeMid
    FROM [Trans].TblMaterialRehandling T0 WITH(NOLOCK)
    JOIN [Master].TblShift T1 WITH(NOLOCK) on T1.SlNo=T0.ShiftId
    JOIN [Master].TblSource T2 WITH(NOLOCK) on T2.SlNo=T0.SourceId
    JOIN [Master].TblDestination T3 WITH(NOLOCK) on T3.SlNo=T0.DestinationId
    JOIN [Master].TblEquipment T4 WITH(NOLOCK) on T4.SlNo=T0.HaulerEquipmentId
    JOIN [Master].TblEquipment T5 WITH(NOLOCK) on T5.SlNo=T0.LoadingMachineEquipmentId
    JOIN [Master].TblMaterial T6 WITH(NOLOCK) on T6.SlNo=T0.MaterialId
    JOIN [Master].TblScale T7 WITH(NOLOCK) on T7.SlNo=T4.ScaleId
    JOIN [Master].TblRelay T8 WITH(NOLOCK) on T8.SlNo=T0.RelayId
    join [Master].TblEquipmentGroup T9 WITH(NOLOCK) on T9.SlNo=T4.EquipmentGroupId
    join [Master].TblEquipmentGroup T10 WITH(NOLOCK) on T10.SlNo=T5.EquipmentGroupId
    
    LEFT JOIN [Master].TblOperator OpLarge WITH(NOLOCK) ON OpLarge.SlNo = T0.ShiftInchargeId
    LEFT JOIN [Master].TblOperator OpMid WITH(NOLOCK) ON OpMid.SlNo = T0.MidScaleInchargeId

    -- Relaxed join for Reading context (Sector/Patch) based on Loading Machine
    left join [Trans].TblEquipmentReading T11 WITH(NOLOCK) on 
            CONVERT(date,T11.Date)=CONVERT(date,T0.RehandlingDate) 
        and T11.ShiftId=T0.ShiftId 
        and T11.EquipmentId=T0.LoadingMachineEquipmentId 
        and T11.IsDelete=0
        
    left join [Master].TblSector T12 WITH(NOLOCK) on T12.SlNo=T11.SectorId 
    Left Join [Master].TblPatch T13 WITH(NOLOCK) ON T13.SlNo=T11.PatchId

    WHERE T0.IsDelete = 0
    AND (CONVERT(date,T0.RehandlingDate) BETWEEN @FromDate AND @ToDate)

    -- Dynamic Filters
    AND (@ShiftIds IS NULL OR T0.ShiftId IN (SELECT value FROM STRING_SPLIT(@ShiftIds, ',')))
    AND (@SourceIds IS NULL OR T0.SourceId IN (SELECT value FROM STRING_SPLIT(@SourceIds, ',')))
    AND (@DestinationIds IS NULL OR T0.DestinationId IN (SELECT value FROM STRING_SPLIT(@DestinationIds, ',')))
    AND (@HaulerIds IS NULL OR T0.HaulerEquipmentId IN (SELECT value FROM STRING_SPLIT(@HaulerIds, ',')))
    AND (@LoadingMachineIds IS NULL OR T0.LoadingMachineEquipmentId IN (SELECT value FROM STRING_SPLIT(@LoadingMachineIds, ',')))
    AND (@MaterialIds IS NULL OR T0.MaterialId IN (SELECT value FROM STRING_SPLIT(@MaterialIds, ',')))
    AND (@RelayIds IS NULL OR T0.RelayId IN (SELECT value FROM STRING_SPLIT(@RelayIds, ',')))
    AND (@ScaleIds IS NULL OR T4.ScaleId IN (SELECT value FROM STRING_SPLIT(@ScaleIds, ',')))
    AND (@SectorIds IS NULL OR T11.SectorId IN (SELECT value FROM STRING_SPLIT(@SectorIds, ',')))
    AND (@PatchIds IS NULL OR T11.PatchId IN (SELECT value FROM STRING_SPLIT(@PatchIds, ',')))
    
    -- Separate filters for Large and Mid Scale incharge
    AND (@ShiftInchargeIds IS NULL OR T0.ShiftInchargeId IN (SELECT value FROM STRING_SPLIT(@ShiftInchargeIds, ',')))
    AND (@MidScaleInchargeIds IS NULL OR T0.MidScaleInchargeId IN (SELECT value FROM STRING_SPLIT(@MidScaleInchargeIds, ',')))

    ORDER BY T0.RehandlingDate ASC
END

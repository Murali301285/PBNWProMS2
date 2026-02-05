CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportMaterialRehandling]
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
            DECLARE @ActivityId INT = 3; -- Loading Activity ID (as Rehandling machines log readings under Loading)

            SELECT 
                T0.SlNo, 
                FORMAT(T0.RehandlingDate,'yyyy') as Year, 
                FORMAT(T0.RehandlingDate,'MMMM-yy') as Month,
                FORMAT(T0.RehandlingDate,'dd-MMM-yy') as Date,
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

            -- Relaxed join (same as Loading Report)
            left join [Trans].TblEquipmentReading T11 WITH(NOLOCK) on 
                 CONVERT(date,T11.Date)=CONVERT(date,T0.RehandlingDate) 
                and T11.ShiftId=T0.ShiftId 
                and T11.EquipmentId=T0.LoadingMachineEquipmentId 
                and T11.IsDelete=0
                -- AND T11.ActivityId=@ActivityId (Relaxed)
                
            left join [Master].TblSector T12 WITH(NOLOCK) on T12.SlNo=T11.SectorId 
            Left Join [Master].TblPatch T13 WITH(NOLOCK) ON T13.SlNo=T11.PatchId
            WHERE T0.IsDelete = 0
            AND (CONVERT(date,T0.RehandlingDate) BETWEEN @FromDate AND @ToDate)
            ORDER BY T0.RehandlingDate ASC
END

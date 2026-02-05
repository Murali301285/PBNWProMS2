CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportOperatorPerformanceLoading]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- CTE_Incharge: Get Distinct Incharges (Large & Mid) per Machine/Shift from Loading Data
    -- We UNPIVOT this so we get one row per Incharge Type (Large/Mid)
    ;WITH CTE_Incharge AS (
        SELECT 
            LoadingMachineEquipmentId,
            ShiftId,
            Cast(LoadingDate as Date) as LDate,
            ShiftInchargeId as InchargeId,
            'Large' as Scale
        FROM [Trans].[TblLoading]
        WHERE IsDelete = 0 
          AND Cast(LoadingDate as Date) = @Date
          AND ShiftInchargeId IS NOT NULL
        GROUP BY LoadingMachineEquipmentId, ShiftId, Cast(LoadingDate as Date), ShiftInchargeId

        UNION ALL

        SELECT 
            LoadingMachineEquipmentId,
            ShiftId,
            Cast(LoadingDate as Date) as LDate,
            MidScaleInchargeId as InchargeId,
            'Mid' as Scale
        FROM [Trans].[TblLoading]
        WHERE IsDelete = 0 
          AND Cast(LoadingDate as Date) = @Date
          AND MidScaleInchargeId IS NOT NULL
        GROUP BY LoadingMachineEquipmentId, ShiftId, Cast(LoadingDate as Date), MidScaleInchargeId
    ),

    -- CTE_Production: Pre-aggregate Production Data per Machine/Shift
    CTE_Production AS (
        SELECT 
            LoadingMachineEquipmentId,
            ShiftId,
            Cast(LoadingDate as Date) as LDate,
            SUM(CASE WHEN MaterialId = 7 THEN 1 ELSE 0 END) as CoalTrips, -- 7=ROM COAL
            SUM(CASE WHEN MaterialId = 7 THEN TotalQty ELSE 0 END) as CoalQty,
            SUM(CASE WHEN M.MaterialName IN ('TOP SOIL', 'OVER BURDEN', 'INTER BURDEN') THEN 1 ELSE 0 END) as OBTrips,
            SUM(CASE WHEN M.MaterialName IN ('TOP SOIL', 'OVER BURDEN', 'INTER BURDEN') THEN TotalQty ELSE 0 END) as OBQty
        FROM [Trans].[TblLoading] L
        JOIN [Master].TblMaterial M ON L.MaterialId = M.SlNo
        WHERE L.IsDelete = 0 
          AND Cast(L.LoadingDate as Date) = @Date
        GROUP BY LoadingMachineEquipmentId, ShiftId, Cast(LoadingDate as Date)
    )

    SELECT 
        I.LDate as [Date],
        
        op.OperatorName, -- This is now the Incharge Name
        I.Scale,         -- New Scale Column
        
        s.ShiftName,
        Eq.EquipmentName as VehicleNo,
        eg.Name as VehicleModel,
        sec.SectorName as Sector,
        rel.Name as Relay,
        
        -- Hours from Equipment Reading
        -- Note: If multiple Incharges exist for same machine/shift, they BOTH get the full machine hours/production (Shared Credit)
        ISNULL(R.OHMR, 0) as EHStart,
        ISNULL(R.CHMR, 0) as EHClose,
        ISNULL(R.TotalWorkingHr, 0) as WHr,

        -- Production from Loading (Joined from CTE)
        ISNULL(P.CoalTrips, 0) as CoalTrips,
        ISNULL(P.CoalQty, 0) as CoalQty,
        ISNULL(P.OBTrips, 0) as OBTrips,
        ISNULL(P.OBQty, 0) as OBQtyBCM

    FROM CTE_Incharge I
    LEFT JOIN [Master].[TblOperator] op ON I.InchargeId = op.SlNo
    
    -- Join to Equipment Reading to get Location & Hours
    LEFT JOIN [Trans].[TblEquipmentReading] R ON 
        R.EquipmentId = I.LoadingMachineEquipmentId 
        AND R.ShiftId = I.ShiftId 
        AND Cast(R.[Date] as Date) = I.LDate
        AND R.IsDelete = 0

    -- Join Masters via Reading (Location etc) or Equipment
    LEFT JOIN [Master].[TblEquipment] as Eq on I.LoadingMachineEquipmentId = Eq.SlNo
    LEFT JOIN [Master].TblEquipmentGroup as eg on Eq.EquipmentGroupId = eg.SlNo
    LEFT JOIN [Master].TblShift as s on I.ShiftId = s.SlNo
    
    -- Location comes from Reading
    LEFT JOIN [Master].TblSector as sec on R.SectorId = sec.SlNo
    LEFT JOIN [Master].TblRelay as rel on R.RelayId = rel.SlNo

    -- Join Production
    LEFT JOIN CTE_Production P ON 
        P.LoadingMachineEquipmentId = I.LoadingMachineEquipmentId 
        AND P.ShiftId = I.ShiftId 
        AND P.LDate = I.LDate

    ORDER BY op.OperatorName, I.Scale, s.ShiftName;
END

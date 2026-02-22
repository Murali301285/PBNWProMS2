CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_sp_SectorWiseProductionReport]
    @Date DATE,
    @ShiftId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- =============================================
    -- 1. Get Production Data (Aggregated by Equipment)
    -- =============================================
    WITH ProductionData AS (
        SELECT
            L.LoadingMachineEquipmentId,
            SUM(L.NoofTrip) as Trips,
            SUM(L.TotalQty) as Qty
        FROM [Trans].[TblLoading] L WITH(NOLOCK)
        JOIN [Master].[TblMaterial] M WITH(NOLOCK) ON L.MaterialId = M.SlNo
        WHERE L.IsDelete = 0
          AND CAST(L.LoadingDate AS DATE) = @Date
          AND (@ShiftId IS NULL OR L.ShiftId = @ShiftId)
          -- Filter for OB Materials
          AND M.MaterialName IN ('OVER BURDEN', 'OB') 
        GROUP BY L.LoadingMachineEquipmentId
    )
    SELECT
        S.SectorName,
        E.EquipmentName,
        ISNULL(P.Name, '-') as PatchName,
        ISNULL(Met.Name, '-') as MethodName,
        
        -- Metrics
        ISNULL(PD.Trips, 0) as Trips,
        ISNULL(PD.Qty, 0) as QtyBCM,
        ISNULL(R.TotalWorkingHr, 0) as OBHrs,
        
        -- Calculated Fields
        0 as TargetBCMHr, 
        CASE 
            WHEN ISNULL(R.TotalWorkingHr, 0) > 0 THEN CAST(ISNULL(PD.Qty, 0) / R.TotalWorkingHr AS DECIMAL(18, 2))
            ELSE 0 
        END as BCMHr

    -- Primary Source: Equipment Reading (Allocation)
    FROM [Trans].[TblEquipmentReading] R WITH(NOLOCK)
    
    JOIN [Master].[TblSector] S WITH(NOLOCK) ON R.SectorId = S.SlNo
    JOIN [Master].[TblEquipment] E WITH(NOLOCK) ON R.EquipmentId = E.SlNo
    LEFT JOIN [Master].[TblPatch] P WITH(NOLOCK) ON R.PatchId = P.SlNo
    LEFT JOIN [Master].[TblMethod] Met WITH(NOLOCK) ON R.MethodId = Met.SlNo
    
    -- Join Production Data
    LEFT JOIN ProductionData PD ON R.EquipmentId = PD.LoadingMachineEquipmentId -- Assuming 1:1 for Date/Shift map

    WHERE R.IsDelete = 0
      AND CAST(R.Date AS DATE) = @Date
      AND (@ShiftId IS NULL OR R.ShiftId = @ShiftId)
      AND S.IsActive = 1
      AND S.IsDelete = 0

    ORDER BY S.SectorName ASC, E.EquipmentName ASC;

END

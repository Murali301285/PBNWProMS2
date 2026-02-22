CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_sp_SectorWiseProductionReport]
    @Date DATE,
    @ShiftId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- =============================================
    -- 1. Get Production Data (Loading + Hauling)
    -- =============================================
    WITH ProductionDataSources AS (
        -- Excavator Loading Data
        SELECT
            L.LoadingMachineEquipmentId AS EquipmentId,
            L.NoofTrip,
            L.TotalQty AS Qty
        FROM [Trans].[TblLoading] L WITH(NOLOCK)
        WHERE L.IsDelete = 0
          AND CAST(L.LoadingDate AS DATE) = @Date
          AND (@ShiftId IS NULL OR L.ShiftId = @ShiftId)
          AND L.MaterialId IN (2, 10) -- 2: OVER BURDEN, 10: OB

        UNION ALL

        -- Dumper Hauling Data
        SELECT
            L.HaulerEquipmentId AS EquipmentId,
            L.NoofTrip,
            L.TotalQty AS Qty
        FROM [Trans].[TblLoading] L WITH(NOLOCK)
        WHERE L.IsDelete = 0
          AND CAST(L.LoadingDate AS DATE) = @Date
          AND (@ShiftId IS NULL OR L.ShiftId = @ShiftId)
          AND L.MaterialId IN (2, 10) -- 2: OVER BURDEN, 10: OB
    ),
    ProductionData AS (
        SELECT
            EquipmentId,
            SUM(NoofTrip) AS Trips,
            SUM(Qty) AS Qty
        FROM ProductionDataSources
        GROUP BY EquipmentId
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
    
    -- Join Production Data (Matches either Link 1 or Link 2 from CTE)
    LEFT JOIN ProductionData PD ON R.EquipmentId = PD.EquipmentId

    WHERE R.IsDelete = 0
      AND CAST(R.Date AS DATE) = @Date
      AND (@ShiftId IS NULL OR R.ShiftId = @ShiftId)
      AND S.IsActive = 1
      AND S.IsDelete = 0

    ORDER BY S.SectorName ASC, E.EquipmentName ASC;

END

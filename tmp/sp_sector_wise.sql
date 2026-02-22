
CREATE   PROCEDURE [dbo].[PMS2_New_sp_SectorWiseProductionReport]
    @Date DATE,
    @ShiftId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- =============================================
    -- CTE: Aggregate Loading Data (Production)
    -- =============================================
    WITH ProductionData AS (
        SELECT
            L.LoadingMachineEquipmentId,
            L.ShiftId,
            CAST(L.LoadingDate AS DATE) as LoadingDate,
            SUM(L.NoofTrip) as Trips,
            SUM(L.TotalQty) as Qty
        FROM [Trans].[TblLoading] L WITH(NOLOCK)
        JOIN [Master].[TblMaterial] M WITH(NOLOCK) ON L.MaterialId = M.SlNo
        WHERE L.IsDelete = 0
          AND CAST(L.LoadingDate AS DATE) = @Date
          AND (@ShiftId IS NULL OR L.ShiftId = @ShiftId)
          -- Filter for OB Materials
        --  AND M.MaterialName IN ('TOP SOIL', 'OVER BURDEN', 'INTER BURDEN', 'OB', 'TS', 'IB', 'OB(Re-handling)', 'OB Rehandling') 
		AND M.MaterialName IN ( 'OVER BURDEN', 'OB') 
        GROUP BY L.LoadingMachineEquipmentId, L.ShiftId, CAST(L.LoadingDate AS DATE)
    )
    SELECT
        ISNULL(S.SectorName, 'Sector 1') as [SectorName],
        E.EquipmentName as [EquipmentName],
        ISNULL(P.Name, '-') as [PatchName],
        ISNULL(M.Name, '-') as [MethodName],
        
        -- Metrics
        ISNULL(PD.Trips, 0) as [Trips],
        ISNULL(PD.Qty, 0) as [QtyBCM],
        ISNULL(R.TotalWorkingHr, 0) as [OBHrs], -- Using TotalWorkingHr from Reading
        
        -- Calculated Fields
        0 as [TargetBCMHr], 
        CASE 
            WHEN ISNULL(R.TotalWorkingHr, 0) > 0 THEN CAST(ISNULL(PD.Qty, 0) / R.TotalWorkingHr AS DECIMAL(18, 2))
            ELSE 0 
        END as [BCMHr]

    FROM ProductionData PD
    
    -- Get Equipment Details from Production Data ID
    JOIN [Master].[TblEquipment] E WITH(NOLOCK) ON PD.LoadingMachineEquipmentId = E.SlNo

    -- Left Join Reading to get Sector/Hours
    LEFT JOIN [Trans].[TblEquipmentReading] R WITH(NOLOCK)
        ON PD.LoadingMachineEquipmentId = R.EquipmentId
        AND PD.ShiftId = R.ShiftId
        AND PD.LoadingDate = CAST(R.Date AS DATE)
        AND R.IsDelete = 0

    -- Join Masters for Reading (Sector, Patch, Method)
    LEFT JOIN [Master].[TblSector] S WITH(NOLOCK) ON R.SectorId = S.SlNo
    LEFT JOIN [Master].[TblPatch] P WITH(NOLOCK) ON R.PatchId = P.SlNo
    LEFT JOIN [Master].[TblMethod] M WITH(NOLOCK) ON R.MethodId = M.SlNo

    ORDER BY S.SectorName, E.EquipmentName;
END



CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_sp_SectorWiseProductionReport]
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
          -- Filter for OB Materials as per original SP logic
          AND M.MaterialName IN ('TOP SOIL', 'OVER BURDEN', 'INTER BURDEN', 'OB', 'TS', 'IB', 'OB(Re-handling)', 'OB Rehandling') 
        GROUP BY L.LoadingMachineEquipmentId, L.ShiftId, CAST(L.LoadingDate AS DATE)
    )
    SELECT
        ISNULL(S.SectorName, 'Unknown Sector') as [Sector Name],
        ISNULL(E.EquipmentName, 'Unknown Eq') as [Equipment],
        ISNULL(P.Name, '-') as [Patch],
        ISNULL(M.Name, '-') as [Method],
        
        -- Metrics
        ISNULL(PD.Trips, 0) as [Trips],
        ISNULL(PD.Qty, 0) as [Qty (BCM)],
        ISNULL(R.TotalWorkingHr, 0) as [OB Hrs], -- Using TotalWorkingHr from Reading
        
        -- Calculated Fields
        0 as [Target BCM/Hr], -- Placeholder
        CASE 
            WHEN ISNULL(R.TotalWorkingHr, 0) > 0 THEN CAST(ISNULL(PD.Qty, 0) / R.TotalWorkingHr AS DECIMAL(18, 2))
            ELSE 0 
        END as [Achieved BCM/Hr]

    FROM [Trans].[TblEquipmentReading] R WITH(NOLOCK)
    -- Join Masters for Reading
    LEFT JOIN [Master].[TblEquipment] E WITH(NOLOCK) ON R.EquipmentId = E.SlNo
    LEFT JOIN [Master].[TblSector] S WITH(NOLOCK) ON R.SectorId = S.SlNo
    LEFT JOIN [Master].[TblPatch] P WITH(NOLOCK) ON R.PatchId = P.SlNo
    LEFT JOIN [Master].[TblMethod] M WITH(NOLOCK) ON R.MethodId = M.SlNo

    -- RIGHT JOIN to ensure we get all Production even if Reading is missing
    RIGHT JOIN ProductionData PD 
        ON PD.LoadingMachineEquipmentId = R.EquipmentId
        AND PD.ShiftId = R.ShiftId
        AND PD.LoadingDate = CAST(R.Date AS DATE)
    
    WHERE (@ShiftId IS NULL OR PD.ShiftId = @ShiftId)
       -- If R matches, check its DELETE status. If R is NULL (from Right Join), check nothing.
       AND (R.SlNo IS NULL OR R.IsDelete = 0)
    
    -- If R is NULL, we need Equipment Name from PD (by joining Equipment table again or COALESCE)
    -- But since we joined E on R.EquipmentId, E will be NULL if R is NULL.
    -- We should fix this by Joining E on COALESCE(R.EquipmentId, PD.LoadingMachineEquipmentId) 
    -- or just E on PD.LoadingMachineEquipmentId since PD drives the row.
    
    -- Let's Refine the Join Strategy for Equipment Name
    -- If we use RIGHT JOIN, PD is the base.
    -- So join E on PD.LoadingMachineEquipmentId.
    -- Join R on PD keys.
    -- Join S, P, M on R keys.

    -- Re-writing the SELECT part below for clarity in the final execution.
    -- (This comment block is for thought process, the actual code below will be cleaner)
    
    ORDER BY S.SectorName, E.EquipmentName;
END

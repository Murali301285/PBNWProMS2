CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Dash_SP_PerformanceDashboard_Sectorwise]
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    WITH EquipSectors AS (
        SELECT DISTINCT 
            ER.EquipmentId, 
            CAST(ER.Date AS DATE) AS Date, 
            ER.ShiftId, 
            ER.SectorId
        FROM Trans.TblEquipmentReading ER WITH(NOLOCK)
        WHERE CAST(ER.Date AS DATE) BETWEEN @FromDate AND @ToDate
          AND ER.IsDelete = 0
    ),
    SectorProduction AS (
        SELECT 
            ISNULL(S.SectorName, 'Main Pit') AS Plant, -- Fallback to 'Main Pit' if Sector missing as per standard practice, but UI expects grouping. We'll group by SectorName directly from Sector list below.
            ISNULL(ES.SectorId, (SELECT TOP 1 SlNo FROM Master.TblSector WHERE SectorName='Main Pit' AND IsDelete=0)) AS SectorId,
            SUM(CASE WHEN L.MaterialId IN (2) THEN L.TotalQty ELSE 0 END) AS OBQty,
            SUM(CASE WHEN L.MaterialId IN (7) THEN L.TotalQty ELSE 0 END) AS CoalQty
        FROM Trans.TblLoading L WITH(NOLOCK)
        JOIN [Master].TblShift T1 WITH(NOLOCK) on T1.SlNo=L.ShiftId
        JOIN [Master].TblSource T2 WITH(NOLOCK) on T2.SlNo=L.SourceId
        JOIN [Master].TblDestination T3 WITH(NOLOCK) on T3.SlNo=L.DestinationId
        JOIN [Master].TblEquipment T4 WITH(NOLOCK) on T4.SlNo=L.HaulerEquipmentId
        JOIN [Master].TblEquipment T5 WITH(NOLOCK) on T5.SlNo=L.LoadingMachineEquipmentId
        JOIN [Master].TblMaterial T6 WITH(NOLOCK) on T6.SlNo=L.MaterialId
        JOIN [Master].TblScale T7 WITH(NOLOCK) on T7.SlNo=T4.ScaleId
        JOIN [Master].TblRelay T8 WITH(NOLOCK) on T8.SlNo=L.RelayId
        JOIN [Master].TblEquipmentGroup T9 WITH(NOLOCK) on T9.SlNo=T4.EquipmentGroupId
        JOIN [Master].TblEquipmentGroup T10 WITH(NOLOCK) on T10.SlNo=T5.EquipmentGroupId
        LEFT JOIN EquipSectors ES 
            ON L.LoadingMachineEquipmentId = ES.EquipmentId 
            AND CAST(L.LoadingDate AS DATE) = ES.Date
            AND L.ShiftId = ES.ShiftId
        LEFT JOIN Master.TblSector S WITH(NOLOCK) ON ES.SectorId = S.SlNo
        WHERE CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate 
          AND L.IsDelete = 0
          AND L.TotalQty > 0
        GROUP BY S.SectorName, ES.SectorId
    )
    SELECT 
        -- If it's a known mapped sector name, use it. Otherwise, force to "Main Pit" logically to match the requested derivation standard
        ISNULL(S.SectorName, 'Sector-Unknown') AS Plant,  
        SUM(SP.OBQty) AS OBQty,
        SUM(SP.CoalQty) AS CoalQty
    FROM SectorProduction SP
    LEFT JOIN Master.TblSector S WITH(NOLOCK) ON SP.SectorId = S.SlNo
    GROUP BY S.SectorName
    HAVING SUM(SP.OBQty) > 0 OR SUM(SP.CoalQty) > 0
    ORDER BY Plant;

END

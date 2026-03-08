
CREATE   PROCEDURE [dbo].[PMS2_New_Dash_SP_PerformanceDashboard_Sectorwise]
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    WITH EquipSectors AS (
        SELECT DISTINCT 
            ER.EquipmentId, 
            CAST(ER.Date AS DA
TE) AS Date, 
            ER.ShiftId, 
            ER.SectorId
        FROM Trans.TblEquipmentReading ER
        WHERE CAST(ER.Date AS DATE) BETWEEN @FromDate AND @ToDate
          AND ER.IsDelete = 0
    )
    SELECT 
        S.SectorName AS Plant,
     
   SUM(CASE WHEN L.MaterialId IN (2) THEN L.TotalQty ELSE 0 END) AS OBQty,
        SUM(CASE WHEN L.MaterialId IN (7) THEN L.TotalQty ELSE 0 END) AS CoalQty
    FROM Trans.TblLoading L
    JOIN EquipSectors ES 
        ON L.LoadingMachineEquipmentId = ES.E
quipmentId 
       AND CAST(L.LoadingDate AS DATE) = ES.Date
       AND L.ShiftId = ES.ShiftId
    JOIN Master.TblSector S ON ES.SectorId = S.SlNo
    WHERE CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate 
      AND L.IsDelete = 0
      AND S.Se
ctorName IS NOT NULL
      AND L.TotalQty > 0
    GROUP BY S.SectorName
    HAVING SUM(CASE WHEN L.MaterialId IN (2) THEN L.TotalQty ELSE 0 END) > 0
        OR SUM(CASE WHEN L.MaterialId IN (7) THEN L.TotalQty ELSE 0 END) > 0
    ORDER BY Plant;
END


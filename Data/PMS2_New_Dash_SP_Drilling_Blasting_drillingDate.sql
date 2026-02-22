CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Dash_SP_Drilling_Blasting_drillingDate]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        D.Date AS DrillingDate,
        M.MaterialName AS Material,
        D.DrillingPatchId,
        L.LocationName AS Location,
        A.AgencyName AS Agency,
        D.Remarks,
        D.NoofHoles,
        D.TotalMeters,
        D.Spacing,
        D.Burden,
        D.AverageDepth AS AvgDepth
    FROM Trans.TblDrilling D WITH(NOLOCK)
    LEFT JOIN Master.TblLocation L WITH(NOLOCK) ON D.LocationId = L.SlNo
    LEFT JOIN Master.TblMaterial M WITH(NOLOCK) ON D.MaterialId = M.SlNo
    LEFT JOIN Master.TblDrillingAgency A WITH(NOLOCK) ON D.DrillingAgencyId = A.SlNo
    WHERE D.IsDelete = 0 
      AND CAST(D.Date AS DATE) = @Date
    ORDER BY M.MaterialName, D.DrillingPatchId;
END

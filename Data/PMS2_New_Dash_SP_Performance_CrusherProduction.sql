CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Dash_SP_Performance_CrusherProduction]
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        P.Name AS PlantName,
        SUM(C.TotalQty) AS TotalQty
    FROM Trans.TblCrusher C WITH(NOLOCK)
    JOIN Master.TblPlant P WITH(NOLOCK) ON C.PlantId = P.SlNo
    WHERE C.IsDelete = 0 
      AND CAST(C.Date AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY P.Name
    ORDER BY P.Name;

END

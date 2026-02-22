
CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Dash_SP_CrushingDashboard]
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- =============================================
    -- 1. Transactions (Production List)
    -- =============================================
    SELECT 
        C.SlNo AS TransactionId,
        FORMAT(CAST(C.Date AS DATE), 'yyyy-MM-dd') AS Date,
        ISNULL(P.Name, 'Unknown') AS CrusherName,
        ISNULL(S.ShiftName, 'Unknown') AS Shift,
        CAST(ISNULL(C.ProductionQty, 0) AS DECIMAL(18,2)) AS Qty, -- Using ProductionQty
        C.Remarks
    FROM Trans.TblCrusher C WITH(NOLOCK)
    LEFT JOIN Master.TblPlant P WITH(NOLOCK) ON C.PlantId = P.SlNo
    LEFT JOIN Master.TblShift S WITH(NOLOCK) ON C.ShiftId = S.SlNo
    WHERE CAST(C.Date AS DATE) >= @FromDate 
      AND CAST(C.Date AS DATE) <= @ToDate 
      AND C.IsDelete = 0
    ORDER BY C.Date, P.Name, S.ShiftName;

    -- =============================================
    -- 2. Stoppages (Summary for Chart)
    -- =============================================
    -- Group by Crusher + Reason
    SELECT 
        ISNULL(P.Name, 'Unknown') AS CrusherName,
        ISNULL(SR.ReasonName, 'Unknown') AS Reason,
        CAST(SUM(ISNULL(CS.StoppageHours, 0)) AS DECIMAL(18,2)) AS TotalDuration
    FROM Trans.TblCrusherStoppage CS WITH(NOLOCK)
    JOIN Trans.TblCrusher C WITH(NOLOCK) ON CS.CrusherId = C.SlNo
    LEFT JOIN Master.TblPlant P WITH(NOLOCK) ON C.PlantId = P.SlNo
    LEFT JOIN Master.TblStoppageReason SR WITH(NOLOCK) ON CS.StoppageId = SR.SlNo
    WHERE CAST(C.Date AS DATE) >= @FromDate 
      AND CAST(C.Date AS DATE) <= @ToDate 
      AND C.IsDelete = 0 AND CS.IsDelete = 0
    GROUP BY P.Name, SR.ReasonName;

    -- =============================================
    -- 3. Stoppage Log (Detailed)
    -- =============================================
    SELECT 
        CS.SlNo,
        FORMAT(CAST(C.Date AS DATE), 'yyyy-MM-dd') AS Date,
        ISNULL(P.Name, 'Unknown') AS CrusherName,
        ISNULL(SR.ReasonName, 'Unknown') AS Reason,
        -- Format Time? 
        -- If FromTime is TimeSpan, convert to string HH:mm
        -- Depending on SQL type, if it's TIME(7), pure CAST to VARCHAR might leave seconds/milliseconds. 
        -- Let's try FORMAT(CAST(FromTime AS DATETIME), 'HH:mm') if possible, or simpler LEFT cast.
        -- Assuming FromTime is standard SQL TIME
        CONVERT(VARCHAR(5), CS.FromTime, 108) AS FromTime,
        CONVERT(VARCHAR(5), CS.ToTime, 108) AS ToTime,
        CAST(ISNULL(CS.StoppageHours, 0) AS DECIMAL(18,2)) AS Duration
    FROM Trans.TblCrusherStoppage CS WITH(NOLOCK)
    JOIN Trans.TblCrusher C WITH(NOLOCK) ON CS.CrusherId = C.SlNo
    LEFT JOIN Master.TblPlant P WITH(NOLOCK) ON C.PlantId = P.SlNo
    LEFT JOIN Master.TblStoppageReason SR WITH(NOLOCK) ON CS.StoppageId = SR.SlNo
    WHERE CAST(C.Date AS DATE) >= @FromDate 
      AND CAST(C.Date AS DATE) <= @ToDate 
      AND C.IsDelete = 0 AND CS.IsDelete = 0
    ORDER BY C.Date DESC, P.Name;

END

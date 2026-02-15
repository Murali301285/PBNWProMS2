IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Report')
BEGIN
    EXEC('CREATE SCHEMA [Report]')
END
GO

CREATE OR ALTER PROCEDURE [Report].[ProMS2_New_Sp_BreakdownTimeAnalysisReport]
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        FORMAT(T.Date, 'dd-MMM-yyyy') AS Date, -- Formatted for display, or return raw date and format in frontend? User asked for date. Let's return formatted.
        -- Actually, standard practice is to return ISO or similar and format in FE, but let's stick to consistent pattern.
        -- Previous reports used dd-MMM-yyyy from DB.
        S.ShiftName,
        ISNULL(T.ShiftChangeTime, 0) AS ShiftChange,
        ISNULL(T.Break_TeaTime, 0) AS BreakTeaTime,
        ISNULL(T.BlastingTime, 0) AS Blasting,
        ISNULL(T.Others, 0) AS Others,
        (ISNULL(T.ShiftChangeTime, 0) + ISNULL(T.Break_TeaTime, 0) + ISNULL(T.BlastingTime, 0) + ISNULL(T.Others, 0)) AS TotalBreakMinutes,
        CAST((8.0 - ((ISNULL(T.ShiftChangeTime, 0) + ISNULL(T.Break_TeaTime, 0) + ISNULL(T.BlastingTime, 0) + ISNULL(T.Others, 0)) / 60.0)) AS DECIMAL(10, 2)) AS TotalWorkingHours
    FROM
        [Report].[TblBreakdownEntry] T
    INNER JOIN
        [Master].[TblShift] S ON T.ShiftId = S.SlNo
    WHERE
        T.Date BETWEEN @FromDate AND @ToDate
    ORDER BY
        T.Date, T.ShiftId;
END
GO

const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2102',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    connectionTimeout: 300000,
    requestTimeout: 300000,
};

const dropQuery = `
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'ProMS2_New_Sp_BreakdownTimeAnalysisReport' AND schema_id = SCHEMA_ID('Report'))
BEGIN
    DROP PROCEDURE [Report].[ProMS2_New_Sp_BreakdownTimeAnalysisReport]
END
`;

const createQuery = `
CREATE OR ALTER PROCEDURE [dbo].[ProMS2_New_Sp_BreakdownTimeAnalysisReport]
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        FORMAT(T.Date, 'dd-MMM-yyyy') AS Date, 
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
`;

async function run() {
    try {
        await sql.connect(config);
        console.log("Connected to ProMS2_2102");

        console.log("Dropping old Report schema SP if exists...");
        await sql.query(dropQuery);

        console.log("Creating new dbo schema SP...");
        await sql.query(createQuery);

        console.log("Successfully moved Breakdown SP to dbo schema!");
        process.exit(0);
    } catch (err) {
        console.error("SQL Error: ", err);
        process.exit(1);
    }
}
run();

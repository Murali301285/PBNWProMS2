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
    }
};

const spCode = `
CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Dash_SP_Performance_CoalOBProduction]
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Date Range Generation
    WITH DateRange AS (
        SELECT @FromDate AS DateValue
        UNION ALL
        SELECT DATEADD(DAY, 1, DateValue)
        FROM DateRange
        WHERE DateValue < @ToDate
    ),
    
    -- 2. Equipment Sectors (Distinct mapping to prevent duplicates)
    EquipSectors AS (
        SELECT DISTINCT 
            ER.EquipmentId, 
            CAST(ER.Date AS DATE) AS Date, 
            ER.ShiftId, 
            ER.SectorId
        FROM Trans.TblEquipmentReading ER WITH(NOLOCK)
        WHERE CAST(ER.Date AS DATE) BETWEEN @FromDate AND @ToDate
          AND ER.IsDelete = 0
    ),

    -- 3. Production Data (Coal & OB from TblLoading)
    ProductionData AS (
        SELECT 
            CAST(L.LoadingDate AS DATE) AS ProductionDate,
            
            -- Coal 
            SUM(CASE WHEN Mt.MaterialName IN ('ROM COAL', 'CRUSHED COAL') AND ISNULL(ES.SectorId, 0) <> 5 THEN L.TotalQty ELSE 0 END) AS Coal_MainPit,
            SUM(CASE WHEN Mt.MaterialName IN ('ROM COAL', 'CRUSHED COAL') AND ISNULL(ES.SectorId, 0) = 5 THEN L.TotalQty ELSE 0 END) AS Coal_WP3,

            -- OB
            SUM(CASE WHEN Mt.MaterialName IN ('OB', 'OVER BURDEN') AND ISNULL(ES.SectorId, 0) <> 5 THEN L.TotalQty ELSE 0 END) AS OB_MainPit,
            SUM(CASE WHEN Mt.MaterialName IN ('OB', 'OVER BURDEN') AND ISNULL(ES.SectorId, 0) = 5 THEN L.TotalQty ELSE 0 END) AS OB_WP3

        FROM Trans.TblLoading L WITH(NOLOCK)
        JOIN EquipSectors ES 
            ON L.LoadingMachineEquipmentId = ES.EquipmentId 
            AND L.ShiftId = ES.ShiftId 
            AND CAST(L.LoadingDate AS DATE) = ES.Date
        LEFT JOIN Master.TblMaterial Mt WITH(NOLOCK) 
            ON L.MaterialId = Mt.SlNo
        WHERE L.IsDelete = 0 
          AND CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate
        GROUP BY CAST(L.LoadingDate AS DATE)
    ),

    -- 4. Rehandling Data (Coal & OB from TblMaterialRehandling)
    RehandlingData AS (
        SELECT 
            CAST(RH.RehandlingDate AS DATE) AS RehandlingDate,

            -- Coal Rehandling
            SUM(CASE WHEN Mt.MaterialName IN ('ROM COAL', 'CRUSHED COAL') AND ISNULL(ES.SectorId, 0) <> 5 THEN RH.TotalQty ELSE 0 END) AS CoalRehandling_MainPit,
            SUM(CASE WHEN Mt.MaterialName IN ('ROM COAL', 'CRUSHED COAL') AND ISNULL(ES.SectorId, 0) = 5 THEN RH.TotalQty ELSE 0 END) AS CoalRehandling_WP3,

            -- OB Rehandling
            SUM(CASE WHEN Mt.MaterialName IN ('OB', 'OVER BURDEN') AND ISNULL(ES.SectorId, 0) <> 5 THEN RH.TotalQty ELSE 0 END) AS OBRehandling_MainPit,
            SUM(CASE WHEN Mt.MaterialName IN ('OB', 'OVER BURDEN') AND ISNULL(ES.SectorId, 0) = 5 THEN RH.TotalQty ELSE 0 END) AS OBRehandling_WP3

        FROM Trans.TblMaterialRehandling RH WITH(NOLOCK)
        JOIN EquipSectors ES 
            ON RH.LoadingMachineEquipmentId = ES.EquipmentId 
            AND RH.ShiftId = ES.ShiftId 
            AND CAST(RH.RehandlingDate AS DATE) = ES.Date
        LEFT JOIN Master.TblMaterial Mt WITH(NOLOCK) 
            ON RH.MaterialId = Mt.SlNo
        WHERE RH.IsDelete = 0
          AND CAST(RH.RehandlingDate AS DATE) BETWEEN @FromDate AND @ToDate
        GROUP BY CAST(RH.RehandlingDate AS DATE)
    )

    -- 5. Final Result using Date Range Left Join
    SELECT 
        FORMAT(D.DateValue, 'dd-MMM-yyyy') AS DateDisplay,
        D.DateValue AS SortDate,
        ISNULL(P.Coal_MainPit, 0) AS Coal_MainPit,
        ISNULL(P.Coal_WP3, 0) AS Coal_WP3,
        ISNULL(P.OB_MainPit, 0) AS OB_MainPit,
        ISNULL(P.OB_WP3, 0) AS OB_WP3,
        ISNULL(RH.OBRehandling_MainPit, 0) AS OBRehandling_MainPit,
        ISNULL(RH.OBRehandling_WP3, 0) AS OBRehandling_WP3,
        ISNULL(RH.CoalRehandling_MainPit, 0) AS CoalRehandling_MainPit,
        ISNULL(RH.CoalRehandling_WP3, 0) AS CoalRehandling_WP3
    FROM DateRange D
    LEFT JOIN ProductionData P ON D.DateValue = P.ProductionDate
    LEFT JOIN RehandlingData RH ON D.DateValue = RH.RehandlingDate
    ORDER BY D.DateValue
    OPTION (MAXRECURSION 0);
END
`;

async function applySP() {
    try {
        const pool = await sql.connect(config);
        await pool.request().batch(spCode);
        console.log("Successfully updated SP PMS2_New_Dash_SP_Performance_CoalOBProduction");
    } catch (err) {
        console.error("Error creating SP: ", err);
    } finally {
        process.exit(0);
    }
}

applySP();

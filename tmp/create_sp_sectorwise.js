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
        FROM Trans.TblEquipmentReading ER
        WHERE CAST(ER.Date AS DATE) BETWEEN @FromDate AND @ToDate
          AND ER.IsDelete = 0
    )
    SELECT 
        ISNULL(S.SectorName, 'Unknown') AS Plant,
        SUM(CASE WHEN L.MaterialId IN (1, 2, 3, 4, 10, 11) THEN L.TotalQty ELSE 0 END) AS OBQty,
        SUM(CASE WHEN L.MaterialId IN (6, 7) THEN L.TotalQty ELSE 0 END) AS CoalQty
    FROM Trans.TblLoading L
    JOIN EquipSectors ES 
        ON L.LoadingMachineEquipmentId = ES.EquipmentId 
       AND CAST(L.LoadingDate AS DATE) = ES.Date
       AND L.ShiftId = ES.ShiftId
    LEFT JOIN Master.TblSector S ON ES.SectorId = S.SlNo
    WHERE CAST(L.LoadingDate AS DATE) BETWEEN @FromDate AND @ToDate 
      AND L.IsDelete = 0
    GROUP BY S.SectorName
    ORDER BY Plant;
END
`;

async function applySP() {
    try {
        const pool = await sql.connect(config);
        await pool.request().batch(spCode);
        console.log("Successfully created SP PMS2_New_Dash_SP_PerformanceDashboard_Sectorwise");
    } catch (err) {
        console.error("Error creating SP: ", err);
    } finally {
        process.exit(0);
    }
}

applySP();

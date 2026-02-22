const sql = require('mssql');
const fs = require('fs');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2102',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function run() {
    try {
        const pool = await sql.connect(config);

        console.log("Testing Crusher Details Query...");
        const query = `
    SELECT
        T1.Name AS Plant,
        SUM(
            CASE 
                WHEN ISNULL(T0.RunningHr, 0) > 0 THEN T0.RunningHr
                ELSE 
                    (
                        CASE 
                            WHEN DATEDIFF(MINUTE, S.FromTime, S.ToTime) < 0 
                            THEN (DATEDIFF(MINUTE, S.FromTime, S.ToTime) + 1440) / 60.0 
                            ELSE DATEDIFF(MINUTE, S.FromTime, S.ToTime) / 60.0 
                        END
                    ) - CAST(ISNULL(T0.TotalStoppageHours, 0) AS FLOAT)
            END
        ) AS RunningHr,
        SUM(T0.ProductionQty) AS TotalQty
    FROM Trans.TblCrusher T0 WITH(NOLOCK)
    JOIN Master.TblPlant T1 WITH(NOLOCK) ON T1.SlNo = T0.PlantId
    LEFT JOIN Master.TblShift S WITH(NOLOCK) ON S.SlNo = T0.ShiftId
    WHERE T0.IsDelete = 0
    GROUP BY T1.Name;
        `;
        const res = await pool.request().query(query);
        console.table(res.recordset);

        // Update the stored procedure now
        const spOld = fs.readFileSync('f:/Dev/ProMS/ProMSDev/tmp/sp_ntpc_current.sql', 'utf8');

        const oldQuery = `    SELECT
        T1.Name AS Plant,
        SUM(T0.RunningHr) AS RunningHr,
        SUM(T0.ProductionQty) AS TotalQty
    FROM Trans.TblCrusher T0 WITH(NOLOCK)
    JOIN Master.TblPlant T1 WITH(NOLOCK) ON T1.SlNo = T0.PlantId
    WHERE T0.IsDelete = 0
      AND CONVERT(DATE, T0.Date) = @Date
      AND T0.ShiftId = @ShiftId
    GROUP BY T1.Name;`;

        const newQuery = `    SELECT
        T1.Name AS Plant,
        SUM(
            CASE 
                WHEN ISNULL(T0.RunningHr, 0) > 0 THEN T0.RunningHr
                ELSE 
                    (
                        CASE 
                            WHEN DATEDIFF(MINUTE, S.FromTime, S.ToTime) < 0 
                            THEN (DATEDIFF(MINUTE, S.FromTime, S.ToTime) + 1440) / 60.0 
                            ELSE ISNULL(DATEDIFF(MINUTE, S.FromTime, S.ToTime) / 60.0, 8.0) 
                        END
                    ) - CAST(ISNULL(T0.TotalStoppageHours, 0) AS DECIMAL(18,2))
            END
        ) AS RunningHr,
        SUM(T0.ProductionQty) AS TotalQty
    FROM Trans.TblCrusher T0 WITH(NOLOCK)
    JOIN Master.TblPlant T1 WITH(NOLOCK) ON T1.SlNo = T0.PlantId
    LEFT JOIN Master.TblShift S WITH(NOLOCK) ON S.SlNo = T0.ShiftId
    WHERE T0.IsDelete = 0
      AND CONVERT(DATE, T0.Date) = @Date
      AND T0.ShiftId = @ShiftId
    GROUP BY T1.Name;`;

        let spNew = spOld.replace(oldQuery, newQuery);
        spNew = spNew.replace('CREATE PROCEDURE', 'ALTER PROCEDURE');

        fs.writeFileSync('f:/Dev/ProMS/ProMSDev/tmp/update_sp_ntpc.sql', spNew);
        console.log("Written SP to update_sp_ntpc.sql");

        await pool.request().batch(spNew);
        console.log("Stored Procedure Updated Sucessfully!");

    } catch (e) {
        console.error("Error:", (e.originalError ? e.originalError : e));
    } finally {
        process.exit();
    }
}
run();

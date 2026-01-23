
import sql from 'mssql';

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433'),
    database: 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
};

async function checkRecentList() {
    try {
        console.log("Connecting...");
        const pool = await sql.connect(config);

        // Exact Query from API (Modified with Fixes)
        let query = `
            SELECT TOP 5
                T.SlNo, 
                T.Date,
                sh.ShiftName as ShiftDisplay, -- FIXED
                incL.OperatorName as ShiftInchargeName,
                incM.OperatorName as MidScaleInchargeName,
                
                -- Operator/Driver (Multiple) with Fallback -- FIXED
                COALESCE((SELECT STUFF((SELECT ', ' + O.OperatorName + ' (' + CAST(O.OperatorId AS VARCHAR) + ')' 
                 FROM [Trans].[TblEquipmentReadingOperator] ERO 
                 JOIN [Master].[TblOperator] O ON ERO.OperatorId = O.SlNo 
                 WHERE ERO.EquipmentReadingId = T.SlNo 
                 FOR XML PATH('')), 1, 2, '')), OMain.OperatorName + ' (' + CAST(OMain.OperatorId AS VARCHAR) + ')') AS OperatorName
            FROM [Trans].[TblEquipmentReading] T
            LEFT JOIN [Master].[TblShift] sh ON T.ShiftId = sh.SlNo
            LEFT JOIN [Master].[TblOperator] incL ON T.ShiftInchargeId = incL.SlNo
            LEFT JOIN [Master].[TblOperator] incM ON T.MidScaleInchargeId = incM.SlNo
            LEFT JOIN [Master].[TblOperator] OMain ON T.OperatorId = OMain.SlNo -- FIXED
            WHERE T.IsDelete = 0
            ORDER BY T.CreatedDate DESC
        `;

        const res = await pool.request().query(query);
        console.table(res.recordset);

    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        process.exit();
    }
}

checkRecentList();

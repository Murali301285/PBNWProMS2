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

async function testQuery() {
    try {
        const pool = await sql.connect(config);

        const query = `
            SELECT DISTINCT L.SlNo, L.LocationName 
            FROM [Master].[TblLocation] L
            INNER JOIN [Master].[TblLocationTypeMapping] M ON L.SlNo = M.LocationId
            INNER JOIN [Master].[TblLocationType] T ON M.LocationTypeId = T.SlNo
            WHERE L.IsDelete = 0 
              AND L.IsActive = 1
              AND M.IsDelete = 0 
              AND M.IsActive = 1
              AND T.IsDelete = 0 
              AND T.IsActive = 1
              AND T.LocationType = 'Dispatch'
            ORDER BY L.LocationName ASC
        `;

        const res = await pool.request().query(query);
        console.log("Found Locations for 'Dispatch':", res.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

testQuery();

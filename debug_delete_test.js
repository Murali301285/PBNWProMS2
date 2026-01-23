const sql = require('mssql');

// Use hardcoded config for quick testing
const config = {
    user: 'sa', // Standard SA
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function testDelete() {
    try {
        await sql.connect(config);
        console.log("Connected.");

        // 1. Get the latest record
        const result = await sql.query("SELECT TOP 1 SlNo, LoadingDate, IsDelete FROM [Trans].[TblLoading] ORDER BY SlNo DESC");
        if (result.recordset.length === 0) {
            console.log("No records found.");
            return;
        }

        const record = result.recordset[0];
        console.log("Latest Record before Update:", record);

        if (record.IsDelete) {
            console.log("Record already deleted. Updating to IsDelete = 0 for testing...");
            await sql.query(`UPDATE [Trans].[TblLoading] SET IsDelete = 0 WHERE SlNo = ${record.SlNo}`);
            console.log("Reset complete.");
        }

        // 2. Perform Soft Delete
        console.log(`Attempting Soft Delete on ID: ${record.SlNo}`);
        const updateQuery = `UPDATE [Trans].[TblLoading] SET IsDelete = 1, UpdatedDate = GETDATE() WHERE SlNo = @id`;

        const request = new sql.Request();
        request.input('id', sql.Int, record.SlNo);
        const updateResult = await request.query(updateQuery);

        console.log("Update Result output:", updateResult); // See rowsAffected

        // 3. Verify
        const verifyResult = await sql.query(`SELECT SlNo, IsDelete FROM [Trans].[TblLoading] WHERE SlNo = ${record.SlNo}`);
        console.log("Record after Update:", verifyResult.recordset[0]);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

testDelete();

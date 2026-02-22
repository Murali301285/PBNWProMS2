const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_1602',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkToday() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const today = '2026-02-19'; // Today's date
        // Also check yesterday just in case
        const yesterday = '2026-02-18';

        console.log(`\n--- Loading Data for ${today} & ${yesterday} ---`);
        const loading = await sql.query(`
            SELECT * 
            FROM Trans.TblLoading 
            WHERE CAST(LoadingDate AS DATE) IN ('${today}', '${yesterday}')
        `);
        console.log(`Loading Count: ${loading.recordset.length}`);
        if (loading.recordset.length > 0) console.table(loading.recordset.slice(0, 10)); // Show top 10

        console.log(`\n--- Rehandling Data for ${today} & ${yesterday} ---`);
        const rehand = await sql.query(`
            SELECT * 
            FROM Trans.TblMaterialRehandling 
            WHERE CAST(RehandlingDate AS DATE) IN ('${today}', '${yesterday}')
        `);
        console.log(`Rehandling Count: ${rehand.recordset.length}`);
        if (rehand.recordset.length > 0) console.table(rehand.recordset.slice(0, 10));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkToday();

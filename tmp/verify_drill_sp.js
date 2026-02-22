
const mssql = require('mssql');

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

async function verifySP() {
    try {
        await mssql.connect(config);

        const date = '2026-02-16'; // Assuming data exists for today or recent
        // Or check a date range if needed, but SP takes single Date. 
        // Let's use today. If no data, I might get empty sets, but structure should be there.

        console.log(`Executing PMS2_New_Dash_SP_GetDrillingBlastingStats for ${date}...`);

        const result = await mssql.query`
            EXEC PMS2_New_Dash_SP_GetDrillingBlastingStats @Date = ${date}
        `;

        console.log("Result Sets:", result.recordsets.length);

        if (result.recordsets.length >= 1) {
            console.log("KPIs:");
            console.table(result.recordsets[0]);
        }

        if (result.recordsets.length >= 2) {
            console.log("Recovery (First 5):");
            console.table(result.recordsets[1].slice(0, 5));
        }

        if (result.recordsets.length >= 3) {
            console.log("Performance (First 5):");
            console.table(result.recordsets[2].slice(0, 5));
        }

        if (result.recordsets.length >= 4) {
            console.log("Supplier:");
            console.table(result.recordsets[3]);
        }

        if (result.recordsets.length >= 5) {
            console.log("Explosive (Pivoted):");
            console.table(result.recordsets[4]);
        }

        if (result.recordsets.length >= 6) {
            console.log("Details (First 5):");
            console.table(result.recordsets[5].slice(0, 5));
        }

    } catch (err) {
        console.error("SP Execution Error:", err);
    } finally {
        await mssql.close();
    }
}

verifySP();

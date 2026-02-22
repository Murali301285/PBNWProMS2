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

        const spOld = fs.readFileSync('f:/Dev/ProMS/ProMSDev/tmp/sp_tsmpl.sql', 'utf8');

        // Let's rewrite the logic inside the SP specifically focusing on SHALE (MaterialId = 4)

        // 1. In variables: add @ShaleId INT = 4
        let spNew = spOld.replace(
            `@DestinationCarpetingWorkId INT = 10;`,
            `@DestinationCarpetingWorkId INT = 10,
            @ShaleId INT = 4;`
        );

        // 2. In TblLoading
        // Replace:
        // -- Carpeting OB (Part 1): Dest = CarpetingWorkId
        // @CarpettingObQty = SUM(CASE 
        //     WHEN DestinationId = @DestinationCarpetingWorkId THEN (NoofTrip * QtyTrip) 
        //     ELSE 0 
        // END)
        spNew = spNew.replace(
            `-- Carpeting OB (Part 1): Dest = CarpetingWorkId
        @CarpettingObQty = SUM(CASE 
            WHEN DestinationId = @DestinationCarpetingWorkId THEN (NoofTrip * QtyTrip) 
            ELSE 0 
        END)`,
            `-- Carpeting OB (Part 1): Material = Shale
        @CarpettingObQty = SUM(CASE 
            WHEN MaterialId = @ShaleId THEN (NoofTrip * QtyTrip) 
            ELSE 0 
        END)`
        );

        // 3. In TblMaterialRehandling
        // Replace:
        // -- Carpeting OB (Part 2): Material = ObRehandling
        // @Rehandling_Carpeting = SUM(CASE 
        //     WHEN MaterialId = @ObRehandlingId THEN (NoofTrip * QtyTrip) 
        //     ELSE 0 
        // END),
        spNew = spNew.replace(
            `-- Carpeting OB (Part 2): Material = ObRehandling
        @Rehandling_Carpeting = SUM(CASE 
            WHEN MaterialId = @ObRehandlingId THEN (NoofTrip * QtyTrip) 
            ELSE 0 
        END),`,
            `-- Carpeting OB (Part 2): Material = Shale
        @Rehandling_Carpeting = SUM(CASE 
            WHEN MaterialId = @ShaleId THEN (NoofTrip * QtyTrip) 
            ELSE 0 
        END),`
        );

        // Optional logic fix for OB: If Dest Carpeting logic was excluding Shale?
        // Old ProdOB: WHEN MaterialId IN (@TopSoilId, @OBId) AND DestinationId != @DestinationCarpetingWorkId
        // The user didn't explicitly say change ProdOB, but if Shale was considered, ShaleId=4 isn't in TopSoil/OB anyway. So ProdOB logic is fine.

        spNew = spNew.replace('CREATE PROCEDURE', 'ALTER PROCEDURE');

        fs.writeFileSync('f:/Dev/ProMS/ProMSDev/tmp/update_sp_tsmpl.sql', spNew);
        console.log("Written SP modification to update_sp_tsmpl.sql");

        await pool.request().batch(spNew);
        console.log("Stored Procedure PMS2_New_Sp_ProductionTSMPLReport Updated Successfully!");

    } catch (e) {
        console.error("Error:", (e.originalError ? e.originalError : e));
    } finally {
        process.exit();
    }
}
run();

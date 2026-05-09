const fs = require('fs');

let sp = fs.readFileSync('f:/Dev/ProMS/ProMSDev/tmp/sp_shift_report.sql', 'utf8');

// Replace CREATE with ALTER
sp = sp.replace('CREATE PROCEDURE', 'ALTER PROCEDURE');

const targetStr = `    -------------------------------------------------------------------
    -- SECTION F: CRUSHING DETAILS
    -------------------------------------------------------------------
    SELECT 
        C.SlNo,
        P.Name AS EquipmentName,
        C.RunningHr,
        C.TotalQty,
        0 AS Budget,
        C.TotalQty AS Actual`;

const replStr = `    -------------------------------------------------------------------
    -- SECTION F: CRUSHING DETAILS
    -------------------------------------------------------------------
    SELECT 
        C.SlNo,
        P.Name AS EquipmentName,
        C.RunningHr,
        C.ProductionQty AS TotalQty,
        0 AS Budget,
        C.ProductionQty AS Actual`;

sp = sp.replace(targetStr, replStr);

fs.writeFileSync('f:/Dev/ProMS/ProMSDev/tmp/alter_shift_report.sql', sp);
console.log('Successfully wrote alter_shift_report.sql');

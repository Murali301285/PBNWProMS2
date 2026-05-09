const fs = require('fs');

let sp = fs.readFileSync('f:/Dev/ProMS/ProMSDev/tmp/sp_daily_progress.sql', 'utf8');

// Replace CREATE with ALTER
sp = sp.replace('CREATE   PROCEDURE', 'ALTER PROCEDURE');

const targetStr = `            SUM(CASE WHEN CAST(Date AS DATE) = @Date THEN TotalQty ELSE 0 END) AS Qty_FTD,
            SUM(CASE WHEN Date >= @StartOfMonth AND CAST(Date AS DATE) <= @Date THEN TotalQty ELSE 0 END) AS Qty_MTD,
            SUM(CASE WHEN Date >= @StartOfYear AND CAST(Date AS DATE) <= @Date THEN TotalQty ELSE 0 END) AS Qty_YTD,`;

const replStr = `            SUM(CASE WHEN CAST(Date AS DATE) = @Date THEN ProductionQty ELSE 0 END) AS Qty_FTD,
            SUM(CASE WHEN Date >= @StartOfMonth AND CAST(Date AS DATE) <= @Date THEN ProductionQty ELSE 0 END) AS Qty_MTD,
            SUM(CASE WHEN Date >= @StartOfYear AND CAST(Date AS DATE) <= @Date THEN ProductionQty ELSE 0 END) AS Qty_YTD,`;

sp = sp.replace(targetStr, replStr);

fs.writeFileSync('f:/Dev/ProMS/ProMSDev/tmp/alter_dpr.sql', sp);
console.log('Script ran successfully');

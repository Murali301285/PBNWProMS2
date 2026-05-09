const fs = require('fs');

let sp = fs.readFileSync('f:/Dev/ProMS/ProMSDev/tmp/sp_op_hauling.sql', 'utf8');

// Replace CREATE with ALTER
sp = sp.replace('CREATE   PROCEDURE', 'ALTER PROCEDURE');

// Add calculated columns and Shift Incharge
const targetColumns = `        ISNULL(L.OBQty, 0) as [OB QTY],

        T0.Remarks as [REMARKS]`;

const replacementColumns = `        ISNULL(L.OBQty, 0) as [OB QTY],

        CASE WHEN T0.NetHMR > 0 THEN CAST(ROUND((ISNULL(L.CoalTrips, 0) + ISNULL(L.OBTrips, 0)) / T0.NetHMR, 0) AS INT) ELSE 0 END AS [TOTAL TRIPS PER HR],
        CASE WHEN T0.NetHMR > 0 THEN CAST(ROUND(((ISNULL(L.CoalQty, 0) / 1.55) + ISNULL(L.OBQty, 0)) / T0.NetHMR, 0) AS INT) ELSE 0 END AS [TOTAL BCM/HR],

        O_Large.OperatorName as [Shift Incharge(Large Scale)],
        O_Mid.OperatorName as [Shift Incharge - Mid Scale],

        T0.Remarks as [REMARKS]`;

sp = sp.replace(targetColumns, replacementColumns);

// Add Joins for Shift Incharge
const joinTarget = `LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON T0.EquipmentId = Eq.SlNo`;

const joinReplacement = `LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON T0.EquipmentId = Eq.SlNo
    LEFT JOIN [Master].TblOperator O_Large WITH(NOLOCK) ON O_Large.SlNo = T0.ShiftInchargeId
    LEFT JOIN [Master].TblOperator O_Mid WITH(NOLOCK) ON O_Mid.SlNo = T0.MidScaleInchargeId`;

sp = sp.replace(joinTarget, joinReplacement);

fs.writeFileSync('f:/Dev/ProMS/ProMSDev/tmp/alter_op_hauling.sql', sp);
console.log('Successfully generated modify_sp_hauling.sql');

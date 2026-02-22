const fs = require('fs');

const dataTableFile = 'f:/Dev/ProMS/ProMSDev/components/DataTable.js';
let dtCode = fs.readFileSync(dataTableFile, 'utf8');

if (!dtCode.includes('onExportExcel')) {
    console.log("Adding onExportExcel prop to DataTable...");

    dtCode = dtCode.replace(
        "columnGroups = [] // New Prop: Array of { title, colSpan } for multi-level headers",
        "columnGroups = [], // New Prop: Array of { title, colSpan } for multi-level headers\n    onExportExcel = null // Optional override for native ExcelJS exports"
    );

    // Let's replace the top of handleExport
    dtCode = dtCode.replace(
        "    const handleExport = () => {",
        "    const handleExport = async () => {\n        if (onExportExcel) {\n            const visibleCols = columns.filter(c => c.accessor !== 'actions' && (c.accessor !== 'SlNo' || showSerialNo) && columnVisibility[c.accessor] !== false);\n            await onExportExcel(sortedData, visibleCols);\n            return;\n        }"
    );

    fs.writeFileSync(dataTableFile, dtCode);
    console.log("DataTable updated to support onExportExcel!");

    const reportTableFile = 'f:/Dev/ProMS/ProMSDev/components/reports/ReportTable.js';
    let rtCode = fs.readFileSync(reportTableFile, 'utf8');

    rtCode = rtCode.replace(
        "columnGroups = []",
        "columnGroups = [],\n    onExportExcel = null"
    );
    rtCode = rtCode.replace(
        "columnGroups={columnGroups}",
        "columnGroups={columnGroups}\n                        onExportExcel={onExportExcel}"
    );

    fs.writeFileSync(reportTableFile, rtCode);
    console.log("ReportTable updated to support onExportExcel!");
} else {
    console.log("DataTable already supports onExportExcel!");
}

const fs = require('fs');
const path = require('path');

const reportsDir = 'f:/Dev/ProMS/ProMSDev/app/dashboard/reports';

const filesToUpdate = [
    {
        file: 'material-rehandling/page.js',
        find: /const \[filter, setFilter\] = useState\({\s+reportType: 'MaterialRehandling',\s+fromDate: '',\s+toDate: ''\s+}\);/g,
        replace: `const getLocalISO = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const sysToday = new Date();
    const firstDayStr = getLocalISO(new Date(sysToday.getFullYear(), sysToday.getMonth(), 1));
    const todayStr = getLocalISO(sysToday);

    const [filter, setFilter] = useState({
        reportType: 'MaterialRehandling',
        fromDate: firstDayStr,
        toDate: todayStr
    });`
    },
    {
        file: 'loading-master/page.js',
        find: /const \[fromDate, setFromDate\] = useState\(''\);\s*const \[toDate, setToDate\] = useState\(''\);/g,
        replace: `const getLocalISO = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const sysToday = new Date();
    const firstDayStr = getLocalISO(new Date(sysToday.getFullYear(), sysToday.getMonth(), 1));
    const todayStr = getLocalISO(sysToday);

    const [fromDate, setFromDate] = useState(firstDayStr);
    const [toDate, setToDate] = useState(todayStr);`
    },
    {
        file: 'hauling-master/page.js',
        find: /const \[fromDate, setFromDate\] = useState\(''\);\s*const \[toDate, setToDate\] = useState\(''\);/g,
        replace: `const getLocalISO = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const sysToday = new Date();
    const firstDayStr = getLocalISO(new Date(sysToday.getFullYear(), sysToday.getMonth(), 1));
    const todayStr = getLocalISO(sysToday);

    const [fromDate, setFromDate] = useState(firstDayStr);
    const [toDate, setToDate] = useState(todayStr);`
    },
    {
        file: 'operator-performance-loading/page.js',
        find: /const \[fromDate, setFromDate\] = useState\(today\);\s*const \[toDate, setToDate\] = useState\(today\);/g,
        replace: `const getLocalISO = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const sysToday = new Date();
    const firstDayStr = getLocalISO(new Date(sysToday.getFullYear(), sysToday.getMonth(), 1));
    const todayStr = getLocalISO(sysToday);

    const [fromDate, setFromDate] = useState(firstDayStr);
    const [toDate, setToDate] = useState(todayStr);`
    },
    {
        file: 'operator-performance-hauling/page.js',
        find: /const \[fromDate, setFromDate\] = useState\(today\);\s*const \[toDate, setToDate\] = useState\(today\);/g,
        replace: `const getLocalISO = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const sysToday = new Date();
    const firstDayStr = getLocalISO(new Date(sysToday.getFullYear(), sysToday.getMonth(), 1));
    const todayStr = getLocalISO(sysToday);

    const [fromDate, setFromDate] = useState(firstDayStr);
    const [toDate, setToDate] = useState(todayStr);`
    },
    {
        file: 'breakdown-time-analysis/page.js',
        find: /const today = new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\];\s*const \[filter, setFilter\] = useState\({\s+fromDate: today,\s+toDate: today\s+}\);/g,
        replace: `const getLocalISO = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const sysToday = new Date();
    const firstDayStr = getLocalISO(new Date(sysToday.getFullYear(), sysToday.getMonth(), 1));
    const todayStr = getLocalISO(sysToday);

    const [filter, setFilter] = useState({
        fromDate: firstDayStr,
        toDate: todayStr
    });`
    },
    {
        file: 'water-tanker-entry/page.js',
        find: /const today = new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\];\s*const \[filter, setFilter\] = useState\({\s+fromDate: today,\s+toDate: today,\s+shiftId: ''\s+}\);/g,
        replace: `const getLocalISO = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const sysToday = new Date();
    const firstDayStr = getLocalISO(new Date(sysToday.getFullYear(), sysToday.getMonth(), 1));
    const todayStr = getLocalISO(sysToday);

    const [filter, setFilter] = useState({
        fromDate: firstDayStr,
        toDate: todayStr,
        shiftId: ''
    });`
    }
];

filesToUpdate.forEach(({ file, find, replace }) => {
    const filePath = path.join(reportsDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        const prevLength = content.length;
        content = content.replace(find, replace);
        if (content.length === prevLength) {
            console.log("Failed to match pattern in:", file);
        } else {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log("Updated:", file);
        }
    } else {
        console.log("File not found:", file);
    }
});

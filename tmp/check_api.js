const http = require('http');

http.get('http://localhost:3005/api/master/equipment', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const jsonData = JSON.parse(data);
        const firstRow = jsonData[0];
        console.log("Keys in first row:", Object.keys(firstRow));
        console.log("First row data:", firstRow);

        // Let's also check if 'pmscode' is anywhere
        const hasLower = Object.keys(firstRow).includes('pmscode');
        console.log("Has lowercase pmscode?", hasLower);
    });
});

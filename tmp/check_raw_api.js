const http = require('http');

http.get('http://localhost:3005/api/master/equipment', (res) => {
    let rawData = '';
    res.on('data', chunk => rawData += chunk);
    res.on('end', () => {
        const text = rawData.substring(0, 500); // Check beginning
        console.log('--- RAW START ---');
        console.log(text);

        let pmsMatches = rawData.match(/"PMSCode"/gi);
        console.log('\n--- HOW MANY TIMES DOES "PMSCode" APPEAR IN THE ENTIRE RESPONSE? ---');
        console.log(pmsMatches ? pmsMatches.length : 0);

        // Let's also see if the equipment ID is appearing as PMSCode
        let pmsValueMatch = text.match(/"PMSCode":.*?[,}]+/gi);
        console.log('--- EXAMPLES OF PMSCODE MATCH ---');
        console.log(pmsValueMatch ? pmsValueMatch.slice(0, 5) : 'None');
    });
});

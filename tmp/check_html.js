const http = require('http');

http.get('http://localhost:3005/dashboard/master/equipment', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        // Look for PMS Code header
        const pmsCodeMatches = data.match(/PMS Code/gi);
        console.log('Number of "PMS Code" headers:', pmsCodeMatches ? pmsCodeMatches.length : 0);

        // Look for duplicated text
        const duplicateMatches = data.match(/20016142001614/g);
        console.log('Found duplicated 20016142001614?', !!duplicateMatches);
    });
});

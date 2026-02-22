// Simulate delay on frontend by modifying Performance.js temporarily or just assume it works if compiled. 
// I'll just check if the file renders without error first.
// Start dev server if not running - already running.

const http = require('http');

http.get('http://localhost:3000/dashboard/performance', (res) => {
    console.log('Status Code:', res.statusCode);
});

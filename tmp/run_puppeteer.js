const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    try {
        await page.goto('http://localhost:3005/dashboard/master/equipment', { waitUntil: 'networkidle0' });

        // Check if we hit a login page
        if (page.url().includes('login') || (await page.$('input[placeholder="Username"]'))) {
            console.log('Logging in...');
            await page.type('input[placeholder="Username"]', 'PROADMIN');
            // We might need to guess the password or just check the HTML that was rendered (Maybe no auth locally?)
            const loginBtn = await page.$('button[type="submit"]') || await page.$('button');
            if (loginBtn) await loginBtn.click();
            await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => { });
            await page.goto('http://localhost:3005/dashboard/master/equipment', { waitUntil: 'networkidle0' });
        }

        // Wait for table to render
        await page.waitForSelector('table', { timeout: 5000 });

        // Grab the HTML of the first row
        const rowHTML = await page.evaluate(() => {
            const tr = document.querySelector('tbody tr');
            return tr ? tr.innerHTML : 'No TR found';
        });

        console.log('\n--- FIRST ROW HTML ---');
        console.log(rowHTML);

        const thHTML = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('thead th')).map(th => th.innerText).join(' | ');
        });
        console.log('\n--- HEADERS ---');
        console.log(thHTML);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
})();

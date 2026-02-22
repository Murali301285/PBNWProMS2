const fs = require('fs');
const file = 'app/dashboard/reports/operator-performance-hauling/page.js';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `<div className={styles.inputGroup}>
                    <label className={styles.label}>
                        Date
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={styles.input}
                    />
                </div>`;

const replaceStr = `<div className={styles.inputGroup}>
                    <label className={styles.label}>
                        From Date
                    </label>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className={styles.input}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>
                        To Date
                    </label>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className={styles.input}
                    />
                </div>`;

if (code.includes('value={date}')) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync(file, code);
    console.log('Fixed UI Date inputs!');
} else {
    console.log('No value={date} found!');
}

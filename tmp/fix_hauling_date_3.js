const fs = require('fs');

try {
    const filePath = 'app/dashboard/reports/operator-performance-hauling/page.js';
    let code = fs.readFileSync(filePath, 'utf8');

    // More defensive replacement strategy. Find the exact block.
    const searchString = `                <div className={styles.inputGroup}>
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

    const replaceString = `                <div className={styles.inputGroup}>
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
        code = code.replace(searchString, replaceString);
        fs.writeFileSync(filePath, code);
        console.log("Successfully replaced date inputs in Operator Hauling");
    } else {
        console.log("Could not find 'value={date}' to replace.");
    }
} catch (e) {
    console.error("Error modifying file:", e);
}

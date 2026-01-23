const fs = require('fs');
const content = `DB_USER=sa
DB_PASSWORD=Chennai@42
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=ProdMS_live
JWT_SECRET=supersecretkey123
PORT=3000

NEXT_PUBLIC_APP_VERSION=2.3.0
NEXT_PUBLIC_LAST_UPDATED=07-Jan-2026
`;

fs.writeFileSync('.env.local', content, 'utf8');
console.log('.env.local updated to localhost with UTF-8 encoding');

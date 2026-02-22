
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceDir = path.join(__dirname, '..', '.next', 'standalone');
const staticSource = path.join(__dirname, '..', '.next', 'static');
const publicSource = path.join(__dirname, '..', 'public');
const destDir = path.join(__dirname, '..', 'deploy_package');

// Clean destination
if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
}
fs.mkdirSync(destDir);

// Copy Recursive Function
function copyRecursiveSync(src, dest) {
    if (fs.existsSync(src)) {
        const stats = fs.statSync(src);
        if (stats.isDirectory()) {
            if (!fs.existsSync(dest)) fs.mkdirSync(dest);
            fs.readdirSync(src).forEach(childItemName => {
                copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
            });
        } else {
            fs.copyFileSync(src, dest);
        }
    }
}

console.log("Copying Standalone Build...");
copyRecursiveSync(sourceDir, destDir);

console.log("Copying Public Folder...");
copyRecursiveSync(publicSource, path.join(destDir, 'public'));

console.log("Copying Static Assets...");
const destStatic = path.join(destDir, '.next', 'static');
if (!fs.existsSync(path.join(destDir, '.next'))) fs.mkdirSync(path.join(destDir, '.next'));
copyRecursiveSync(staticSource, destStatic);

// Create ecosystem.config.js
const ecosystem = `
module.exports = {
  apps: [
    {
      name: 'proms2',
      script: 'server.js',
    }
  ]
};
`;
fs.writeFileSync(path.join(destDir, 'ecosystem.config.js'), ecosystem);

// Create web.config (IIS)
const webConfig = `
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js/debug[/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}" />
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True" />
          </conditions>
          <action type="Rewrite" url="server.js" />
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <add segment="node_modules" />
        </hiddenSegments>
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
`;
fs.writeFileSync(path.join(destDir, 'web.config'), webConfig);

console.log("Deployment Package Created at: " + destDir);
console.log("Ready to copy to Windows Server.");


# ProMS 2.0 Deployment Instructions for Windows Server

## Prerequisites
1. Install Node.js (LTS version) on the Windows Server.
2. (Optional) Install PM2 globally: `npm install -g pm2`
3. (Required for Option B) Install **URL Rewrite Module**: [Download Link](https://www.iis.net/downloads/microsoft/url-rewrite)
4. (Required for Option B) Install **IISNode**: [Download Link](https://github.com/azure/iisnode/releases) (Choose `iisnode-full-v0.2.21-x64.msi` for 64-bit Windows)

## Deployment Steps

1. **Copy Files**: 
   Copy the entire contents of this `deploy_package` folder to your target location on the server (e.g., `C:\Apps\ProMS2`).

2. **Environment Variables**:
   - Create a `.env` file in the root of the deployed folder if needed, or ensure environment variables are set in your system/PM2 config.
   - Example `.env`:
     ```
     PORT=3000
     # Database connection strings if not hardcoded
     ```

## Option A: Running with PM2 (Recommended)
1. Open PowerShell as Administrator.
2. Navigate to the folder: `cd C:\Apps\ProMS2`
3. Start the application:
   ```powershell
   pm2 start ecosystem.config.js
   ```
4. Save the process list to auto-start on reboot:
   ```powershell
   pm2 save
   ```

5. **(Important) Enable Auto-Start on Windows Reboot**:
   The standard `pm2 startup` command often requires an extra module on Windows.
   
   **Method 1 (Try first):**
   ```powershell
   pm2 startup
   ```
   If it outputs a command, run it.

   **Method 2 (Roboust - Recommended):**
   1. Install the Windows Service wrapper:
      ```powershell
      npm install -g pm2-windows-service
      ```
   2. Install the service:
      ```powershell
      pm2-service-install -n
      ```
      *(Type 'n' to skip advanced setup, or 'y' to configure user/permissions).*
   3. Save the current process list:
      ```powershell
      pm2 save
      ```
   Now PM2 will run as a Windows Service and restart your app automatically on reboot.

## Option B: Running with IIS (using IISNode)
1. Create a new Website in IIS Manager.
2. Point the **Physical Path** to this folder (`C:\Apps\ProMS2`).
3. Ensure `web.config` is present (it is included in this package).
4. Ensure the Application Pool has permission to write to this folder (for logs).
5. Browse to the site.

## Troubleshooting
- If you see missing module errors, try running `npm install` in this directory (though most dependencies are pre-bundled).
- Check `logs` folder if creating one, or PM2 logs: `pm2 logs proms2`.
- Port Conflicts: Change `PORT` in `.env` or `ecosystem.config.js`.

# Windows Server Deployment Guide

This guide describes how to host the ProMS application on a Windows Server using **IIS (Internet Information Services)** as a reverse proxy and **PM2** as a process manager for the Node.js application.

## Prerequisites

On the target Windows Server, ensure the following are installed:

1.  **Node.js (LTS Version)**
    - Download and install from [nodejs.org](https://nodejs.org/).
    - Verify by running `node -v` and `npm -v` in a command prompt.

2.  **IIS (Internet Information Services)**
    - Install via Server Manager -> Add Roles and Features -> Web Server (IIS).

3.  **IIS URL Rewrite Module**
    - Download and install from [IIS.net](https://www.iis.net/downloads/microsoft/url-rewrite).
    - **Crucial**: This is required for the `web.config` rewrite rules to work.

4.  **Application Request Routing (ARR)**
    - Download and install from [IIS.net](https://www.iis.net/downloads/microsoft/application-request-routing).
    - Enable "Enable Proxy" in ARR settings in IIS Manager if not enabled by default.

5.  **PM2 (Process Manager)**
    - Install globally via npm:
      ```powershell
      npm install -g pm2
      ```
    - Install `pm2-windows-service` to run PM2 on startup (optional but recommended):
      ```powershell
      npm install -g pm2-windows-service
      pm2-service-install
      ```

## 1. Build the Application

On your development machine:

1.  Open a terminal in the project root (`d:\Dev\ProMS\ProMSDev`).
2.  Run the build command:
    ```powershell
    npm run build
    ```
    This creates an optimized production build in `.next`.
3.  Prepare the deployment files (copy static assets to standalone folder):
    ```powershell
    prepare_deploy.bat
    ```
    *If you don't have this script, it essentially runs:*
    ```powershell
    robocopy public .next\standalone\public /E /IS /IT
    robocopy .next\static .next\standalone\.next\static /E /IS /IT
    ```

## 2. Deploy Files to Server

1.  Copy the contents of the **`.next/standalone`** folder from your dev machine to a folder on the Windows Server (e.g., `C:\inetpub\wwwroot\ProMS`).
2.  Copy `ecosystem.config.js` and `web.config` to the same folder on the server.
    *   **Note**: The logic in `prepare_deploy.bat` might need adjustment to include `ecosystem.config.js` and `web.config` in the copy if you want fully automated copy. For now, manually ensure they are present.
3.  Copy the `.env.local` (or create a `.env.production`) file to the server folder with necessary production environment variables (DB strings, secrets, etc.).

## 3. Start Application with PM2

On the Windows Server:

1.  Open PowerShell/CMD and navigate to the deployment folder:
    ```powershell
    cd C:\inetpub\wwwroot\ProMS
    ```
2.  Start the app using PM2:
    ```powershell
    pm2 start ecosystem.config.js
    ```
3.  Save the PM2 list so it resurrects on reboot:
    ```powershell
    pm2 save
    ```
4.  Verify the app is running on localhost:
    - Open a browser on the server and go to `http://localhost:3000`.

## 4. Configure IIS Reverse Proxy

1.  Open **IIS Manager**.
2.  Right-click **Sites** -> **Add Website**.
    - **Site name**: `ProMS`
    - **Physical path**: `C:\inetpub\wwwroot\ProMS` (or wherever you copied the files).
    - **Binding**: Configure your desired IP/Host and Port (e.g., port 80 or 443).
3.  **web.config Setup**:
    - Ensure the `web.config` file is in the root of the physical path.
    - It should contain the rewrite rule to forward traffic to `http://localhost:3000`.

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <configuration>
        <system.webServer>
            <rewrite>
                <rules>
                    <rule name="ReverseProxyInboundRule1" stopProcessing="true">
                        <match url="(.*)" />
                        <action type="Rewrite" url="http://localhost:3000/{R:1}" />
                    </rule>
                </rules>
            </rewrite>
        </system.webServer>
    </configuration>
    ```

## Troubleshooting

-   **502 Bad Gateway**: This usually means IIS cannot contact the Node.js process.
    -   Check if PM2 process is running (`pm2 status`).
    -   Check if port 3000 is open/listening (`netstat -an | findstr 3000`).
    -   Ensure ARR and URL Rewrite modules are installed.
-   **Static Files 404**:
    -   Ensure the `.next/static` folder was correctly copied to `.next/standalone/.next/static`. The `prepare_deploy.bat` script handles this locally, ensure the full structure is copied to the server.

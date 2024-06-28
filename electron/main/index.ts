import { app, BrowserWindow, shell, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");

async function createWindow() {
  win = new BrowserWindow({
    width: 600,
    height: 400,
    title: "Printer Configuration",
    icon: path.join(process.env.APP_ROOT, "logo.ico"),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    // #298
    win.loadURL(VITE_DEV_SERVER_URL);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});

// Listen for print event
ipcMain.on("print", (event) => {
  const _win = BrowserWindow.getFocusedWindow();
  _win.webContents.print(
    { silent: true, printBackground: true },
    (success, errorType) => {
      if (!success) console.log(errorType);
    }
  );
});

ipcMain.handle("print-silent", async (event, invoiceHTML) => {
  const printWindow = new BrowserWindow({ show: false });
  printWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(`
    <html>
    <head>
      <title>Print Invoice</title>
      <style>
      *,::after,::before{-webkit-box-sizing:border-box;box-sizing:border-box}.h5,.h6{margin-top:0;margin-bottom:.5rem;font-family:Roboto,sans-serif;font-weight:500;line-height:1.2}.h5{font-size:1.125rem}.h6,span{font-size:.725rem}b{font-weight:700}table{caption-side:bottom;border-collapse:collapse}td,tr{border-color:inherit;border-style:solid;border-width:0}.table{width:100%;margin-bottom:1rem;color:#495057;vertical-align:top;border-color:#eff0f2}.table>:not(caption)>*>*{padding:.25rem .25rem;border-bottom-width:.5px}.table-sm>:not(caption)>*>*{padding:.05rem .05rem}.table-borderless>:not(caption)>*>*{border-bottom-width:0}.table-borderless>:not(:first-child){border-top-width:0}.border-bottom{border-bottom:.5px solid #444!important}.mb-0{margin-bottom:0!important}.mb-1{margin-bottom:0.25rem!important}.px-1{padding-right:0.25rem!important;padding-left:0.25rem!important}.py-1{padding-top:0.25rem!important;padding-bottom:0.25rem!important}.fs-5{font-size:1.125rem!important}.fw-bolder{font-weight:bolder!important}.text-end{text-align:right!important}.text-center{text-align:center!important}.text-nowrap{white-space:nowrap!important}.table{border-color:#ecf1f4!important;color:#000!important}.table td{vertical-align:middle}.border-dashed{border-bottom-style:dashed!important}.receipt-body{-webkit-box-flex:1;-ms-flex-positive:1;flex-grow:1;padding:1rem 1rem;overflow-y:auto}#print-container,.bill-container{font-family:system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"}#print-container,.bill-container{display:block!important}@page{margin:.1cm .1cm .1cm}@page:first{margin-top:.2cm};*{print-color-adjust:exact;-webkit-print-color-adjust:exact}ul{padding-left:2rem}ul{margin-top:0;margin-bottom:1rem}ul ul{margin-bottom:0}.d-flex{display:flex!important}.flex-nowrap{flex-wrap:nowrap!important}.align-items-center{align-items:center!important}.my-1{margin-top:0.25rem!important;margin-bottom:0.25rem!important}.me-3{margin-right:1rem!important}.mb-0{margin-bottom:0!important}.mb-2{margin-bottom:0.5rem!important}.ms-auto{margin-left:auto!important}.p-2{padding:0.5rem!important}.px-3{padding-right:1rem!important;padding-left:1rem!important}.py-0{padding-top:0!important;padding-bottom:0!important}.py-2{padding-top:0.5rem!important;padding-bottom:0.5rem!important}.py-4{padding-top:1.5rem!important;padding-bottom:1.5rem!important}.ps-1{padding-left:0.25rem!important}.fw-normal{font-weight:400!important}.fw-bold{font-weight:700!important}.fw-bolder{font-weight:bolder!important}.text-dark{color:#000!important}ul{list-style:none;margin:0;padding:0}.widget-categories ul{margin:0;padding:0;list-style:none}.widget-categories ul>li{position:relative;padding-left:1rem}.widget-categories ul>li>a{display:block;position:relative;-webkit-transition:color 0.25s ease-in-out;transition:color 0.25s ease-in-out;color:rgb(0 0 0 / .65);font-weight:600}.widget-categories ul>li>a:hover{color:rgb(0 0 0 / .9);text-decoration:none}.widget-categories>ul>li{margin-bottom:.5rem;padding-left:1.25rem}.widget-categories .has-children ul{padding-top:.75rem;padding-bottom:.125rem;border-left:1px solid #888}.widget-categories .has-children ul>li{margin-bottom:.1rem}.widget-categories .has-children ul>li span{font-weight:500}.widget-categories .has-children ul>li>a::before{display:block;position:absolute;top:50%;left:-1rem;width:.5rem;height:.0625rem;margin-top:-.0625rem;background-color:#dfdfdf;content:""}.text-foggy{color:#555!important}a{text-decoration:none!important}.d-block{display:block!important}
      </style>
    </head>
    <body>${invoiceHTML}</body>
    </html>
  `)}`
  );

  printWindow.webContents.on("did-finish-load", () => {
    printWindow.webContents.print(
      { silent: true, printBackground: true },
      (success, failureReason) => {
        if (!success) console.log(failureReason);
        printWindow.close();
        console.log("Print Initiated");
      }
    );
  });
});

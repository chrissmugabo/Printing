//handle setupevents as quickly as possible
//import { setupEvents } from "./installers/setupEvents";
import electron from "electron";
import contextMenu from "electron-context-menu";
import path from "path";
/*if (setupEvents.handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
} */

const { app, BrowserWindow, Menu, ipcMain } = electron;
const __dirname = path.resolve();
let menu = Menu.buildFromTemplate([
  {
    label: "Menu",
    submenu: [
      {
        label: "Minimize",
        accelerator: "CmdOrCtrl+M",
        role: "minimize",
      },
      {
        label: "Refresh Page",
        accelerator: "CmdOrCtrl+R",
        click() {
          mainWindow.reload();
        },
      },
      {
        type: "separator",
      },
      {
        label: "Exit",
        click() {
          app.quit();
        },
      },
    ],
  },
]);
Menu.setApplicationMenu(menu);

contextMenu({
  prepend: (params) => [
    {
      label: "Menu",
      visible: params.mediaType === "image",
    },
  ],
});

let mainWindow;

app.setName("Electron Example");

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      enableRemoteModule: false,
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, "/assets/icons/logo.png"),
  });

  mainWindow.setTitle("Printing Service");
  mainWindow.loadURL("file://" + __dirname + "/index.html");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Listen for print event
  ipcMain.on("print", (event) => {
    const win = BrowserWindow.getFocusedWindow();
    win.webContents.print(
      { silent: true, printBackground: true },
      (success, errorType) => {
        if (!success) console.log(errorType);
      }
    );
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
ipcMain.handle("print-silent", async (event, invoiceHTML) => {
  const printWindow = new BrowserWindow({ show: false });
  printWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(`
    <html>
    <head>
      <title>Print Invoice</title>
      <style>
        /* Add any styles you want for the print */
        body { font-family: Arial, sans-serif; }
        h2 { text-align: center; }
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

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
  if (mainWindow === null) {
    createWindow();
  }
});

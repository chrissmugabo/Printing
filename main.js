//handle setupevents as quickly as possible
//import { setupEvents } from "./installers/setupEvents";
import electron from "electron";
import contextMenu from "electron-context-menu";
import path from "path";
/*if (setupEvents.handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
} */

const { app, BrowserWindow, Menu } = electron;
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

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    icon: path.join(__dirname, "/assets/icons/logo.png"),
  });

  mainWindow.setTitle("Printing Service");
  mainWindow.loadURL("file://" + __dirname + "/index.html");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});

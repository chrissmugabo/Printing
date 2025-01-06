const createWindowsInstaller =
  require("electron-winstaller").createWindowsInstaller;
const path = require("path");

getInstallerConfig()
  .then(createWindowsInstaller)
  .catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });

function getInstallerConfig() {
  const rootPath = path.join("./");
  const outPath = path.join(rootPath, "release-builds");

  return Promise.resolve({
    appDirectory: path.join(outPath, "printing-service-win32-x64/"),
    authors: "Tame Apps",
    noMsi: true,
    outputDirectory: path.join(outPath, "windows-installer"),
    exe: "printing-service.exe",
    setupExe: "PrintingServiceInstaller.exe",
    setupIcon: path.join(rootPath, "assets", "app-icon", "win", "icon.ico"),
    description:
      "Invoices and Orders printing configurations for different printers",
    skipUpdateIcon: true,
    createDesktopShortcut: true, 
    createStartMenuShortcut: true,
  });
}

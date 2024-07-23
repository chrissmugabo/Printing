const electron = require("electron");
const path = require("path");
const fs = require("fs");
const { app, BrowserWindow, ipcMain } = electron;
const {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
  BreakLine,
} = require("node-thermal-printer");
const { PrismaClient } = require("@prisma/client");
const userDataPath = app.getPath("userData");
const dbFilePath = path.join(userDataPath, "printing.sqlite");
let requireInitialization = false;
if (!fs.existsSync(dbFilePath)) {
  fs.writeFileSync(dbFilePath, "", "utf8");
  requireInitialization = true;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbFilePath}`,
    },
  },
});

let mainWindow;
app.setName("Printing Service");

// Helper functions
const helper = {
  timeZone: "Africa/Kigali",
  formatNumber: (number) => {
    if (!number) {
      return 0;
    }
    let str = number.toString();
    const decimalIndex = str.indexOf(".");
    const decimalPlaces = 3;
    if (decimalIndex !== -1) {
      const limitedDecimal = str.substr(decimalIndex + 1, decimalPlaces);
      str = str.substr(0, decimalIndex + 1) + limitedDecimal;
    }
    return str.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },

  empty(mixedVar) {
    let undef, key, i, len;
    const emptyValues = [undef, null, false, 0, "", "0"];
    for (i = 0, len = emptyValues.length; i < len; i++) {
      if (mixedVar === emptyValues[i]) {
        return true;
      }
    }
    if (typeof mixedVar === "object") {
      for (key in mixedVar) {
        if (Object.prototype.hasOwnProperty.call(mixedVar, key)) {
          return false;
        }
      }
      return true;
    }
    return false;
  },
  formatDate(str) {
    let options = {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: this.timeZone,
    };
    let today = new Date(str);
    return today.toLocaleDateString("en-US", options);
  },
  formatTime(str) {
    return new Date(str).toLocaleTimeString("en-US", {
      timeZone: this.timeZone,
    });
  },
  formatOrderTime(str) {
    return new Date(str)
      .toTimeString("en-US", { timeZone: this.timeZone })
      .slice(0, 5);
  },
  generateVoucherNo(no) {
    if (no) {
      let len = no.toString().length;
      if (len >= 4) return no;
      if (len == 1) return `000${no}`;
      if (len == 2) return `00${no}`;
      if (len == 3) return `0${no}`;
    }
  },

  padNumber(number, targetedLength = 5) {
    let strNumber = number.toString();
    if (strNumber.length < targetedLength) {
      let padding = new Array(targetedLength - strNumber.length + 1).join("0");
      return padding + strNumber;
    }
    return number;
  },

  formatMoney(num) {
    return `${this.formatNumber(num)}`;
  },

  generateFormData(obj) {
    const formData = new FormData();
    for (let key in obj) {
      if (obj[key] !== null && typeof obj[key] !== "undefined") {
        if (typeof obj[key] === "object")
          formData.append(key, JSON.stringify(obj[key]));
        else formData.append(key, obj[key]);
      }
    }
    return formData;
  },
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 650,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      enableRemoteModule: false,
      nodeIntegration: true,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "/assets/icons/logo.png"),
  });

  mainWindow.setTitle("Printing Service");
  mainWindow.loadURL("file://" + __dirname + "/index.html");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.on("did-finish-load", async () => {
    if (requireInitialization) {
      try {
        await prisma.$connect();
        const createPrinterTable = `
          CREATE TABLE IF NOT EXISTS printers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            type TEXT NOT NULL,
            ip TEXT,
            port TEXT,
            interface TEXT NOT NULL,
            content TEXT
          );
        `;
        const createUserTable = `
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
          );
        `;
        const createSettingTable = `
          CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch_id INTEGER NOT NULL,
            branch_name TEXT NOT NULL,
            base_url TEXT NOT NULL
          );
        `;
        await prisma.$executeRawUnsafe(createPrinterTable);
        await prisma.$executeRawUnsafe(createUserTable);
        await prisma.$executeRawUnsafe(createSettingTable);
        await prisma.user.create({
          data: {
            name: "Super Admin",
            email: "webmaster@gmail.com",
            password: "tame123",
          },
        });
      } catch (error) {
        await prisma.$disconnect();
      } finally {
        await prisma.$disconnect();
      }
    }
    mainWindow.webContents.getPrintersAsync().then((printers) => {
      mainWindow.webContents.send("printersList", printers);
    });
  });
}

app.on("ready", () => {
  createWindow();
});

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

app.on("before-quit", async () => {
  await prisma.$disconnect();
});

ipcMain.on("authenticated", async (event) => {
  const settings = await prisma.setting.findFirst();
  const printers = await prisma.printer.findMany();
  event.reply("availableSettings", { settings, printers });
});

ipcMain.handle("print-content", async (event, data) => {
  const options = {
    type: PrinterTypes[data.type], // or PrinterTypes.STAR
    characterSet: CharacterSet.PC852_LATIN2,
    removeSpecialCharacters: false,
    breakLine: BreakLine.WORD,
    options: {
      timeout: 5000,
    },
  };
  if (data.ip) {
    options.interface = `tcp://${data.ip}`;
  } else {
    options.interface = `//localhost/${data.port}`;
  }
  const printer = new ThermalPrinter(options);
  const increaseMomoSize = (text) => {};
  const orderDate = `${data?.order?.system_date} ${data?.order?.order_time}`;
  try {
    await printer.isPrinterConnected();
    printer.alignCenter();
    printer.setTypeFontA();
    printer.setTextDoubleHeight();
    printer.setTextDoubleWidth();
    printer.println(data?.settings?.site_name);
    printer.setTextNormal();
    printer.println(`TIN: ${data?.settings?.app_tin}`);
    printer.println(`Tel: ${data?.settings?.app_phone}`);
    printer.println(`Email: ${data?.settings?.app_email}`);
    printer.println(`Address: ${data?.settings?.site_address}`);
    printer.drawLine();

    printer.alignLeft();
    if (data?.round?.category === "ORDER") {
      printer.println(
        `Order #: ${helper.generateVoucherNo(data?.round?.round_no)}(${
          data?.round?.destination
        })`
      );
    } else {
      printer.println(
        `Invoice #: ${helper.generateVoucherNo(data?.order?.id)}`
      );
    }
    printer.println(`Customer: ${data?.order?.client || "Walk-In"}`);
    printer.tableCustom([
      {
        text: `Served By: ${data?.order?.waiter}`,
        align: "LEFT",
      },
      { text: `Table No: ${data?.order?.table_name}`, align: "RIGHT" },
    ]);

    printer.tableCustom([
      {
        text: `Date: ${helper.formatDate(orderDate)}`,
        align: "LEFT",
      },
      {
        text: `Time: ${helper.formatTime(orderDate)}`,
        align: "RIGHT",
      },
    ]);

    printer.drawLine();

    printer.tableCustom([
      { text: "Item", align: "LEFT", width: 0.5, bold: true },
      { text: "Qty", align: "CENTER", width: 0.1, bold: true },
      { text: "Price", align: "CENTER", width: 0.18, bold: true },
      { text: "Total", align: "RIGHT", width: 0.22, bold: true },
    ]);

    printer.drawLine();

    data?.items.forEach((item) => {
      printer.tableCustom([
        { text: item.name, align: "LEFT", width: 0.5 },
        { text: item.quantity, align: "CENTER", width: 0.1 },
        { text: helper.formatMoney(item.price), align: "CENTER", width: 0.18 },
        { text: helper.formatMoney(item.amount), align: "RIGHT", width: 0.22 },
      ]);
      if (item?.comment && data?.round?.category === "ORDER") {
        printer.setTypeFontB();
        printer.tableCustom([
          {
            text: `\x1B\x45\x01Notes: \x1B\x45\x00${item.comment}`,
            align: "LEFT",
            width: 1,
          },
        ]);
        printer.setTypeFontA();
      }
    });

    printer.drawLine();
    if (data?.round?.category !== "ORDER") {
      printer.alignRight();
      printer.setTextDoubleWidth();
      printer.println(`Total: ${helper.formatMoney(data?.order?.grand_total)}`);
      printer.setTextNormal();
      printer.drawLine();
      printer.alignCenter();
      printer.print(`Dial `);
      printer.bold(true);
      //printer.print(`\x1B\x45\x01${data?.settings?.momo_code}\x1B\x45\x00`);
      printer.setTextQuadArea(); 
      printer.setTypeFontB();
      printer.print(`${data?.settings?.momo_code}`);
      printer.bold(false);
      printer.setTextNormal();
      printer.setTypeFontA();
      printer.print(` to pay with MOMO`);
      printer.newLine();
      printer.println(
        `This is not a legal receipt. Please ask your legal receipt.`
      );
      printer.println(`Thank you!`);
    }
    printer.cut();
    printer.beep();
    await printer.execute();
    mainWindow?.webContents.send("printedContent", {
      latest: data?.round?.id,
      content: data?.content,
    });
  } catch (error) {
    mainWindow?.webContents.send("retryPrinting", data);
    //console.error("Print failed:", error);
  }
});

ipcMain.handle("add-printer", async (event, printer) => {
  const { id } = printer;
  let result;
  if (id) {
    result = await prisma.printer.update({
      data: printer,
      where: { id },
    });
  } else {
    result = await prisma.printer.create({
      data: printer,
    });
  }
  if (result) {
    mainWindow?.webContents.send("recordSaved", { type: "printer", result });
  }
});

ipcMain.handle("delete-printer", async (event, printerId) => {
  await prisma.printer.delete({ where: { id: printerId } });
  mainWindow?.webContents.send("recordSaved", {
    type: "printer-deleted",
    result: printerId,
  });
});

ipcMain.handle("save-settings", async (event, settings) => {
  const row = await prisma.setting.findFirst();
  let result;
  if (row) {
    result = await prisma.setting.update({
      data: settings,
      where: { id: row.id },
    });
  } else {
    result = await prisma.setting.create({
      data: settings,
    });
  }
  if (result) {
    mainWindow?.webContents.send("recordSaved", { type: "settings", result });
  }
});

ipcMain.handle("login-action", async (event, password) => {
  const user = await prisma.user.findFirst();
  const response = user.password === password;
  mainWindow?.webContents.send("authResponse", response);
});

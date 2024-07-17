const electron = require("electron");
const path = require("path");
const { app, BrowserWindow, ipcMain } = electron;
const {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
  BreakLine,
} = require("node-thermal-printer");
//const {ThermalPrinter } = require("node-thermal-printer").printer;
//const PrinterTypes = require("node-thermal-printer").types;

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

const printContent = async (data) => {
  const options = {
    type: PrinterTypes.EPSON, // or PrinterTypes.STAR
    characterSet: CharacterSet.PC852_LATIN2, // Printer character set
    removeSpecialCharacters: false, // Removes special characters - default: false
    lineCharacter: "=", // Set character for lines - default: "-"
    breakLine: BreakLine.WORD,
    options: {
      timeout: 5000,
    },
  };
  if (data.ip) {
    options.interface = `tcp://${data.ip}`;
  } else {
    options.interface = `printer:${printer}`;
  }
  const printer = new ThermalPrinter(options);

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
    printer.println(
      `${
        data?.round?.category === "ORDER" ? "Order" : "Invoice"
      } #: ${helper.generateVoucherNo(data?.round?.round_no)}`
    );
    printer.println(`Customer: ${data?.order?.client?.name || "Walk-In"}`);
    printer.tableCustom([
      {
        text: `Served By: ${
          data?.order?.waiter?.last_name || data?.order?.waiter?.name
        }`,
        align: "LEFT",
      },
      { text: `Table No: ${data?.order?.table?.name}`, align: "RIGHT" },
    ]);

    printer.tableCustom([
      {
        text: `Date: ${helper.formatDate(data?.order?.order_date)}`,
        align: "LEFT",
      },
      {
        text: `Time: ${helper.formatTime(data?.order?.order_date)}`,
        align: "RIGHT",
      },
    ]);

    printer.drawLine();

    printer.tableCustom([
      { text: "Item", align: "LEFT", width: 0.5 },
      { text: "Qty", align: "CENTER", width: 0.1 },
      { text: "Price", align: "CENTER", width: 0.2 },
      { text: "Total", align: "RIGHT", width: 0.2 },
    ]);

    data?.items.forEach((item) => {
      printer.tableCustom([
        { text: item.name, align: "LEFT", width: 0.5 },
        { text: item.quantity, align: "CENTER", width: 0.1 },
        { text: helper.formatMoney(item.price), align: "CENTER", width: 0.2 },
        { text: helper.formatMoney(item.amount), align: "RIGHT", width: 0.2 },
      ]);
    });

    printer.drawLine();

    printer.alignRight();
    //printer.println("Subtotal: $20.00");
    //printer.println("Tax: $2.00");
    printer.setTextDoubleWidth();
    printer.println(`Total: ${helper.formatMoney(data?.order?.grand_total)}`);
    printer.setTextNormal();
    printer.drawLine();
    if (data?.round?.category !== "ORDER") {
      printer.alignCenter();
      printer.println(`Dial ${data?.settings?.momo_code} to pay with MOMO`);
      printer.println(
        `This is not a legal receipt. Please ask your legal receipt.`
      );
      printer.println(`Thank you!`);
    }
    printer.cut();

    await printer.execute();
  } catch (error) {
    console.error("Print failed:", error);
  }
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
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

  mainWindow.webContents.on("did-finish-load", () => {});
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

ipcMain.on("getPrinters", (event) => {
  mainWindow.webContents.getPrintersAsync().then((printers) => {
    event.reply("printersList", printers);
  });
});

ipcMain.handle("print-content", async (event, data) => {
  printContent(data);
});

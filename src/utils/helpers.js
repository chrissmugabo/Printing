//import { ipcRenderer } from "electron";

export const printInvoice = (id) => {
  /*window.ipcRenderer.invoke("print-silent", testData).then(() => {
    console.log("Print Tested");
  }); */
  const elt = document.getElementById(id);
  if (elt) {
    const invoiceHTML = elt.innerHTML;
    window.ipcRenderer.invoke("print-silent", invoiceHTML).then(() => {
      console.log("Print request sent");
    });
  }
};

export const helper = {
  timeZone: localStorage.getItem("_tz") || "Africa/Kigali",
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
    return `RWF ${this.formatNumber(num)}`;
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

export const testData = [
  {
    type: "text", // 'text' | 'barCode' | 'qrCode' | 'image' | 'table' | 'divider'
    value: "SAMPLE HEADING",
    style: { fontWeight: "700", textAlign: "center", fontSize: "14px" },
  },
  {
    type: "divider", // we could style it using the style property, we can use divider anywhere, except on the table header
  },
  {
    type: "text",
    value: "Secondary text",
    style: {
      textDecoration: "underline",
      fontSize: "10px",
      textAlign: "center",
      color: "red",
    },
  },
  {
    type: "text",
    value: "Table 1",
    style: { fontWeight: "700", textAlign: "center", fontSize: "14px" },
  },
  {
    type: "table",
    // style the table
    style: { border: "1px solid #ddd", fontFamily: "sans-serif" },
    // list of the columns to be rendered in the table header
    tableHeader: ["Animal", "Age"],
    // multi dimensional array depicting the rows and columns of the table body
    tableBody: [
      ["Cat", 2],
      ["Dog", 4],
      ["Horse", 12],
      ["Pig", 4],
    ],
    // list of rows to be rendered in the table footer
    tableFooter: [
      [
        { type: "text", value: "Subtotal" },
        { type: "text", value: "22" },
      ],
      [
        { type: "text", value: "Total" },
        { type: "text", value: "22" },
      ],
    ],
    // custom style for the table header
    tableHeaderStyle: { backgroundColor: "#000", color: "white" },
    // custom style for the table body
    tableBodyStyle: { border: "0.5px solid #ddd" },
    // custom style for the table footer
    tableFooterStyle: { backgroundColor: "#000", color: "white" },
    // custom style for the header cells
    tableHeaderCellStyle: {
      padding: "2px 2px",
    },
    // custom style for the body cells
    tableBodyCellStyle: {
      padding: "10px 2px",
    },
    // custom style for the footer cells
    tableFooterCellStyle: {
      padding: "5px 2px",
      fontWeight: "400",
    },
  },
];

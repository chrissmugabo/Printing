module.exports = {
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
    return str.slice(0, str.length - 3);
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
  formateEbmDate(timestamp) {
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    const hour = timestamp.substring(8, 10);
    const minute = timestamp.substring(10, 12);
    const second = timestamp.substring(12, 14);
    const formattedDate = `${day}/${month}/${year} ${hour}:${minute}:${second}`;
    return formattedDate;
  },
};

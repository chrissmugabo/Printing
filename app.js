const { createApp, ref, computed, onBeforeMount } = Vue;
const generateFormData = (obj) => {
  const formData = new FormData();
  for (let key in obj) {
    if (obj[key] !== null && typeof obj[key] !== "undefined") {
      if (typeof obj[key] === "object")
        formData.append(key, JSON.stringify(obj[key]));
      else formData.append(key, obj[key]);
    }
  }
  return formData;
};

const App = {
  setup() {
    const displayMode = ref("PRINTERS_VIEW"); // PRINTERS_VIEW or FORM_VIEW
    const appSettings = ref({});
    const printers = ref([]);
    const activePrinters = ref([]);
    const printerIpAddress = ref("");
    const printerPort = ref("");
    const printerType = ref("EPSON");
    const printerInterface = ref("TCP");
    const selectedPrinter = ref("");
    const selectedPrinterId = ref(null);
    const branches = ref([]);
    const content = ref([]);
    const url = ref("");
    const branch = ref({});
    const choosenBranchId = ref();
    const authenticated = ref(false);
    const isLoading = ref(false);
    const password = ref("");
    const invalidPasword = ref(false);
    const isAuthenticating = ref(false);
    const hasFlashMessage = ref(false);
    const message = ref();
    const isFetching = ref(false);
    const roundsUrl = computed(() => {
      if (branch.value && url.value) {
        const url = `next-printable-round?branch_id=${branch?.value?.id}`;
        return url;
      }
      return null;
    });

    const invoicesPrinter = computed(() => {
      return activePrinters.value.find(
        (printer) => JSON.parse(printer.content).indexOf("I") !== -1
      );
    });

    const kitchenOrdersPrinter = computed(() => {
      return activePrinters.value.find(
        (printer) => JSON.parse(printer.content).indexOf("K") !== -1
      );
    });

    const bardOrdersPrinter = computed(() => {
      return activePrinters.value.find(
        (printer) => JSON.parse(printer.content).indexOf("B") !== -1
      );
    });

    onBeforeMount(() => {
      axios.interceptors.request.use(
        (config) => {
          isLoading.value = true;
          return config;
        },
        (error) => {
          isLoading.value = false;
          return Promise.reject(error);
        }
      );

      axios.interceptors.response.use(
        (response) => {
          isLoading.value = false;
          return response;
        },
        (error) => {
          isLoading.value = false;
          return Promise.reject(error);
        }
      );

      window.ipcRenderer.on("authResponse", (event, response) => {
        authenticated.value = response;
        if (response) {
          window.ipcRenderer.send("authenticated");
          toggleFlashMessage({
            type: "success",
            text: "Authenticated successfully",
          });
        } else {
          toggleFlashMessage({
            type: "danger",
            text: "Invalid Password. Try again",
          });
          invalidPasword.value = true;
        }
      });

      window.ipcRenderer.on("printersList", (event, _printers) => {
        printers.value = _printers;
      });

      window.ipcRenderer.on("printedContent", (event, meta) => {
        fetchInvoices(meta);
      });

      window.ipcRenderer.on("retryPrinting", (event, data) => {
        window.ipcRenderer.invoke("print-content", data).then(() => {
          console.log("Print retry sent...");
        });
      });

      window.ipcRenderer.on("recordSaved", (event, data) => {
        const { type, result } = data;
        switch (type) {
          case "printer":
            if (selectedPrinterId.value) {
              const index = activePrinters.value.findIndex(
                (printer) => printer.id == selectedPrinterId.value
              );
              if (index !== -1) {
                activePrinters.value[index] = result;
              }
            } else {
              activePrinters.value.push(result);
            }
            displayMode.value = "PRINTERS_VIEW";
            resetForm();
            break;
          case "settings":
            branch.value = {
              id: result.branch_id,
              name: result.branch_name,
            };
            break;
          case "printer-deleted":
            const index = activePrinters.value.findIndex(
              (printer) => printer.id == result
            );
            if (index !== -1) {
              activePrinters.value.splice(index, 1);
            }
            break;
          default:
            break;
        }
        toggleFlashMessage({
          type: "success",
          text: "Database updated successfully",
        });
        fetchInvoices();
      });

      window.ipcRenderer.on("availableSettings", (event, data) => {
        const { settings, printers } = data;
        activePrinters.value = printers;
        if (settings && Object.keys(settings).length > 0) {
          url.value = settings.base_url;
          choosenBranchId.value = settings.branch_id;
          branch.value = {
            id: settings.branch_id,
            name: settings.branch_name,
          };
          axios.get(settings.base_url + "/api/preloaders").then((response) => {
            appSettings.value = response?.data;
            if (activePrinters.value.length) {
              fetchInvoices();
            }
          });
        }
      });
    });

    function getBranches() {
      axios.get(url.value + "/api/pos/pos-branches").then((response) => {
        branches.value = response.data.branches;
      });
    }

    function fetchInvoices(meta = null) {
      if (roundsUrl.value && activePrinters.value.length) {
        let _url = `${url.value}/api/pos/${roundsUrl.value}`;
        if (meta) {
          if (meta.latest) {
            _url += `&latest=${meta.latest}`;
          }
          if (meta.content) {
            _url += `&content=${meta.content}`;
          }
        }
        isFetching.value = true;
        axios
          .get(_url)
          .then((response) => {
            const { status, round, order, items } = response.data;
            isFetching.value = false;
            if (status) {
              let printer;
              if (round.destination === "KITCHEN") {
                printer = kitchenOrdersPrinter.value;
              } else if (round.destination === "BAR") {
                printer = bardOrdersPrinter.value;
              } else {
                printer = invoicesPrinter.value;
              }
              if (printer) {
                const _content = JSON.parse(printer.content);
                const data = {
                  printer: printer.name,
                  type: printer.type,
                  interface: printer.interface,
                  port: printer.port,
                  ip: printer.ip,
                  round: round,
                  items: items,
                  order: order,
                  settings: { ...appSettings.value },
                  content: _content.join(""),
                };
                window.ipcRenderer
                  .invoke("print-content", data)
                  .then(() => {
                    console.log("Print request sent...");
                  })
                  .catch((error) => {
                    console.error("Catched Error:", error);
                  });
              }
            } else {
              fetchInvoices(meta);
              /* if (round) {
              axios.get(
                `${url.value}/api/pos/update-printed-round/${round.id}`
              );
            } */
            }
          })
          .catch(() => {
            isFetching.value = false;
            fetchInvoices(meta);
          });
      }
    }

    function resetForm() {
      selectedPrinterId.value = null;
      selectedPrinter.value = "";
      printerIpAddress.value = "";
      printerPort.value = "";
      printerType.value = "EPSON";
      printerInterface.value = "TCP";
    }

    function setPrinter() {
      const printer = {
        name: selectedPrinter.value,
        type: printerType.value,
        ip: printerIpAddress.value,
        port: printerPort.value,
        interface: printerInterface.value,
        content: JSON.stringify(content.value),
      };
      if (selectedPrinterId.value) {
        printer.id = selectedPrinterId.value;
      }
      window.ipcRenderer.invoke("add-printer", printer);
    }

    function updateSettings() {
      const row = branches.value.find(
        (_branch) => _branch.id == choosenBranchId.value
      );
      if (row) {
        const settings = {
          branch_name: row.name,
          base_url: url.value,
          branch_id: row.id,
        };
        window.ipcRenderer.invoke("save-settings", settings);
      }
    }

    function showPrinterForm(printer = null) {
      if (printer) {
        selectedPrinterId.value = printer.id;
        selectedPrinter.value = printer.name;
        printerType.value = printer.type;
        printerIpAddress.value = printer.ip;
        printerPort.value = printer.port;
        printerInterface.value = printer.interface;
        content.value = JSON.parse(printer.content);
      }
      displayMode.value = "FORM_VIEW";
    }

    function handleCancel() {
      resetForm();
      displayMode.value = "PRINTERS_VIEW";
    }

    function deletePrinter(printer) {
      if (
        confirm(`Are you sure you want to remove printer ${printer?.name}?`)
      ) {
        window.ipcRenderer.invoke("delete-printer", printer.id);
      }
    }

    function handleLogin() {
      invalidPasword.value = false;
      isAuthenticating.value = true;
      window.ipcRenderer.invoke("login-action", password.value).then(() => {
        isAuthenticating.value = false;
      });
    }

    function showPrinterContent(content) {
      const abbr = JSON.parse(content).join("");
      const len = String(abbr).length;
      let result;
      if (len === 1) {
        switch (abbr) {
          case "K":
            result = "Kitchen Orders";
            break;
          case "B":
            result = "Bard Orders";
            break;
          case "I":
            result = "Invoices";
            break;
          default:
            break;
        }
      } else if (len === 2) {
        if (abbr === "KB" || abbr === "BK") {
          result = "Kitchen & Bar Orders";
        } else if (abbr === "KI" || abbr === "IK") {
          result = "Kitchen Orders & Invoices";
        } else if (abbr === "BI" || abbr === "IB") {
          result = "BAR & Invoices";
        }
      } else {
        result = "All Orders and Invoices";
      }

      return result;
    }

    function toggleFlashMessage(msg) {
      hasFlashMessage.value = !hasFlashMessage.value;
      message.value = msg;
      setTimeout(() => (hasFlashMessage.value = !hasFlashMessage.value), 3000);
    }

    function changeBranch() {
      choosenBranchId.value = undefined;
      branches.value = [];
      branch.value = {};
    }

    return {
      isAuthenticating,
      authenticated,
      appSettings,
      printers,
      selectedPrinter,
      branches,
      content,
      url,
      branch,
      choosenBranchId,
      roundsUrl,
      printerIpAddress,
      printerType,
      printerInterface,
      printerPort,
      displayMode,
      selectedPrinterId,
      invoicesPrinter,
      kitchenOrdersPrinter,
      bardOrdersPrinter,
      fetchInvoices,
      getBranches,
      invalidPasword,
      hasFlashMessage,
      toggleFlashMessage,
      message,
      password,
      resetForm,
      setPrinter,
      activePrinters,
      updateSettings,
      showPrinterForm,
      deletePrinter,
      showPrinterContent,
      handleCancel,
      handleLogin,
      isLoading,
      changeBranch,
    };
  },
};

createApp(App).mount("#app");

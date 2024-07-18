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
    const printInterval = ref(null);
    const latestPrintedRoundId = ref(null);
    const choosenBranchId = ref();
    const roundsUrl = computed(() => {
      const printingContent = content.value.join("");
      if (branch.value && content.value) {
        const url = latestPrintedRoundId.value
          ? `next-printable-round?latest=${latestPrintedRoundId.value}&branch_id=${branch?.value?.id}&content=${printingContent}`
          : `next-printable-round?branch_id=${branch?.value?.id}&content=${printingContent}`;
        return url;
      }
      return null;
    });

    onBeforeMount(() => {
      window.ipcRenderer.on("printersList", (event, _printers) => {
        printers.value = _printers;
      });
      window.ipcRenderer.on("printedContent", (event, id) => {
        axios.get(`${url.value}/api/pos/update-printed-round/${id}`);
      });
      window.ipcRenderer.on("recordSaved", (event, data) => {
        clearInterval(printInterval.value);
        const { type, result } = data;
        switch (type) {
          case "printer":
            activePrinters.value.push(result);
            displayMode.value = "PRINTERS_VIEW";
            break;
          case "settings":
            branch.value = {
              id: result.branch_id,
              name: result.branch_name,
            };
            break;
          case "delete-printer":
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
          const keys = [
            "site_address",
            "site_name",
            "currency",
            "site_logo",
            "contact_one",
            "app_phone",
            "app_email",
            "app_tin",
            "momo_code",
            "airtel_code",
            "disabled_direct_print",
          ];
          axios
            .post(
              settings.base_url + "/api/pos/frontend/preloaders",
              generateFormData({ keys })
            )
            .then((response) => {
              appSettings.value = response?.data?.result;
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

    function fetchInvoices() {
      if (roundsUrl.value && activePrinters.value.length) {
        printInterval.value = setInterval(() => {
          axios
            .get(url.value + "/api/pos/" + roundsUrl.value)
            .then((response) => {
              const round = response.data.round;
              const order = response.data.order;
              const items = response.data.items;
              const data = {
                printer: selectedPrinter.value,
                type: printerType.value,
                interface: printerInterface.value,
                port: printerPort.value,
                ip: printerIpAddress.value,
                round: round,
                items: items,
                order: order,
                settings: { ...appSettings.value },
              };
              window.ipcRenderer.invoke("print-content", data).then(() => {
                console.log("Print request sent");
              });
            });
        }, 4000);
      }
    }

    function resetForm() {
      clearInterval(printInterval.value);
      branch.value = {};
      selectedPrinter.value = "";
    }

    async function setPrinter() {
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

    async function updateSettings() {
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
        selectedPrinterId.value.id = printer.id;
        selectedPrinter.value = printer.name;
        printerType.value = printer.type;
        printerIpAddress.value = printer.ip;
        printerPort.value = printer.port;
        printerInterface.value = printer.interface;
        content.value = JSON.parse(printer.content);
      }
      displayMode.value = "FORM_VIEW";
    }

    async function deletePrinter(printer) {
      if (
        confirm(`Are you sure you want to remove printer ${printer?.name}?`)
      ) {
        window.ipcRenderer.invoke("delete-printer", printer.id);
      }
    }

    return {
      appSettings,
      printers,
      selectedPrinter,
      branches,
      content,
      url,
      branch,
      printInterval,
      latestPrintedRoundId,
      choosenBranchId,
      roundsUrl,
      printerIpAddress,
      printerType,
      printerInterface,
      printerPort,
      displayMode,
      selectedPrinterId,
      fetchInvoices,
      getBranches,
      resetForm,
      setPrinter,
      activePrinters,
      updateSettings,
      showPrinterForm,
      deletePrinter,
    };
  },
};

createApp(App).mount("#app");

const { createApp, ref, computed, onMounted, nextTick, onBeforeMount } = Vue;
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
    const appSettings = ref({});
    const printers = ref([]);
    const printerIpAddress = ref("");
    const selectedPrinter = ref("");
    const branches = ref([]);
    const content = ref([]);
    const url = ref("");
    const branch = ref({});
    const printInterval = ref(null);
    const isFetchingRounds = ref(false);
    const latestPrintedRoundId = ref(null);
    const choosenBranchId = ref();
    const roundsUrl = computed(() => {
      const printingContent = content.value.join("");
      if (branch.value) {
        const url = latestPrintedRoundId.value
          ? `next-printable-round?latest=${latestPrintedRoundId.value}&branch_id=${branch?.value?.id}&content=${printingContent}`
          : `next-printable-round?branch_id=${branch?.value?.id}&content=${printingContent}`;
        return url;
      }
      return null;
    });

    onBeforeMount(() => {
      window.ipcRenderer.send("getPrinters");
      window.ipcRenderer.on("printersList", (event, _printers) => {
        printers.value = _printers;
      });

      const _url = localStorage.getItem("url");
      const _printer = localStorage.getItem("printer");
      const _content = localStorage.getItem("__printing_content");
      const _ip = localStorage.getItem("printer_ip_address");
      if (_ip) {
        printerIpAddress.value = _ip;
      }
      if (_url && _printer && _content) {
        selectedPrinter.value = _printer;
        url.value = _url;
        content.value = JSON.parse(_content);
        const _branch = localStorage.getItem("branch");
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
            _url + "/api/pos/frontend/preloaders",
            generateFormData({ keys })
          )
          .then((response) => {
            appSettings.value = response?.data?.result;
          });
        if (_branch) {
          branch.value = JSON.parse(_branch);
        } else {
          axios.get(url.value + "/api/pos/pos-branches").then((response) => {
            branches.value = response.data.branches;
          });
        }
      }
    });

    onMounted(() => {
      nextTick(() => {
        fetchInvoices();
      });
    });

    function setUrl() {
      localStorage.setItem("url", url.value);
      axios.get(url.value + "/api/pos/pos-branches").then((response) => {
        branches.value = response.data.branches;
      });
    }
    function setBranch() {
      const row = branches.value.find(
        (_branch) => _branch.id == choosenBranchId.value
      );
      if (row) {
        branch.value = row;
        localStorage.setItem("branch", JSON.stringify(row));
        localStorage.setItem(
          "__printing_content",
          JSON.stringify(content.value)
        );
        localStorage.setItem("printer_ip_address", printerIpAddress.value);
        setTimeout(() => {
          fetchInvoices();
        }, 250);
      } else {
        localStorage.removeItem("branch");
      }
    }

    function fetchInvoices() {
      const lastPrintedRound = localStorage.getItem("__last_printed_round");
      if (lastPrintedRound) {
        latestPrintedRoundId.value = lastPrintedRound;
      }
      setTimeout(() => {
        sessionStorage.setItem("isPrinting", "true");
        printInterval.value = setInterval(() => {
          if (!isFetchingRounds.value && branch.value && roundsUrl.value) {
            isFetchingRounds.value = true;
            axios
              .get(url.value + "/api/pos/" + roundsUrl.value)
              .then((response) => {
                isFetchingRounds.value = false;
                if (response.data.status) {
                  const round = response.data.round;
                  const order = response.data.order;
                  const items = response.data.items;
                  const data = {
                    printer: selectedPrinter.value,
                    round: round,
                    items: items,
                    order: order,
                    ip: printerIpAddress.value,
                    settings: { ...appSettings.value },
                  };
                  window.ipcRenderer.invoke("print-content", data).then(() => {
                    console.log("Print request sent");
                  });
                  latestPrintedRoundId.value = round.id;
                  localStorage.setItem(
                    "__last_printed_round",
                    latestPrintedRoundId.value
                  );
                } else {
                  if (response.data.round) {
                    latestPrintedRoundId.value = response.data?.round?.id;
                    localStorage.setItem(
                      "__last_printed_round",
                      latestPrintedRoundId.value
                    );
                  }
                }
              });
          }
        }, 6000);
        // End of interval
      }, 2000);
    }

    function setPrinter(event) {
      if (event.target) {
        localStorage.setItem("printer", event.target.value);
      }
    }

    function resetSettings() {
      clearInterval(printInterval.value);
      branch.value = {};
      localStorage.removeItem("branch");
      localStorage.removeItem("printer");
      selectedPrinter.value = "";
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
      isFetchingRounds,
      latestPrintedRoundId,
      choosenBranchId,
      roundsUrl,
      printerIpAddress,
      setUrl,
      setBranch,
      fetchInvoices,
      setPrinter,
      resetSettings,
    };
  },
};

createApp(App).mount("#app");

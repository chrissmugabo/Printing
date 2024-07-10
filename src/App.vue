<script setup lang="ts">
import axios from "axios";
import OrderPreview from "./components/OrderPreview.vue";
import InvoicePreview from "./components/InvoicePreview.vue";
import PrintingFlag from "./components/PrintingFlag.vue";
import { useLayout } from "./hooks/useLayout";
import { ref, computed, onMounted, nextTick, onBeforeMount } from "vue";
import { helper } from "./utils/helpers";

const { appSettings } = useLayout();
const printers = ref<Electron.PrinterInfo[]>([]);
const selectedPrinter = ref("");
const branches = ref<any>([]);
const content = ref<String[]>([]);
const url = ref("");
const branch = ref<any>({});
const printableRound = ref<any>({});
const roundItems = ref<any>([]);
const printInterval = ref<any>(null);
const isFetchingRounds = ref(false);
const placedOrder = ref<any>({});
const latestPrintedRoundId = ref<any>(null);
const printedInvoice = ref<any>({});
const invoiceItems = ref<any>([]);
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
        helper.generateFormData({ keys })
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
    (_branch: any) => _branch.id == choosenBranchId.value
  );
  if (row) {
    branch.value = row;
    localStorage.setItem("branch", JSON.stringify(row));
    localStorage.setItem("__printing_content", JSON.stringify(content.value));
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
              const items = response.data.items;
              const order = response.data.order;
              if (round.category == "ORDER") {
                printableRound.value = round;
                roundItems.value = items;
                placedOrder.value = order;
              } else {
                if (Array.isArray(round?.items) && round?.items?.length > 0) {
                  order.grand_total = round?.items.reduce(
                    (a: any, b: any) => a + Number(b.amount),
                    0
                  );
                }
                printedInvoice.value = order;
                invoiceItems.value = items;
              }
              latestPrintedRoundId.value = round.id;
              localStorage.setItem(
                "__last_printed_round",
                latestPrintedRoundId.value
              );
            }
          });
      }
    }, 6000);
    // End of interval
  }, 2000);
}

function setPrinter(event: any) {
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
</script>
<template>
  <div class="container">
    <div class="row">
      <div
        class="col-12 pt-3"
        v-if="!Object.keys(branch).length || !url || !selectedPrinter"
      >
        <h4>Configure Printing Service</h4>
        <hr />
        <div class="form-group row mb-2 align-items-center">
          <label class="col-4">Printer:</label>
          <div class="col-8">
            <select
              class="form-control form-select"
              @change="setPrinter($event)"
              v-model="selectedPrinter"
            >
              <option value="null" hidden disabled>Select Printer</option>
              <option
                :value="printer.name"
                v-for="printer in printers"
                :key="printer.name"
              >
                {{ printer.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="form-group row mb-2 align-items-center">
          <label class="col-4">URL:</label>
          <div class="col-8">
            <input
              type="text"
              class="form-control"
              placeholder="Eg: https://demo.tameaps.com/"
              v-model="url"
            />
          </div>
        </div>
        <div
          class="form-group row mb-2 align-items-center"
          v-if="!branches.length"
        >
          <div class="col-12">
            <button
              type="button"
              class="btn btn-primary"
              @click="setUrl()"
              :disabled="!url"
            >
              Get Branches
            </button>
          </div>
        </div>
        <div
          class="form-group row mb-3 align-items-center"
          v-if="branches.length"
        >
          <label class="col-4">Branch:</label>
          <div class="col-8">
            <select class="form-control form-select" v-model="choosenBranchId">
              <option value="null" hidden disabled>Select Branch</option>
              <option
                :value="branch.id"
                v-for="branch in branches"
                :key="branch.id"
              >
                {{ branch.name }}
              </option>
            </select>
          </div>
        </div>
        <div
          class="form-group row mb-2 align-items-center"
          v-if="branches.length"
        >
          <label class="col-4">Printable Content:</label>
          <div class="col-8">
            <div
              style="
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                grid-template-rows: repeat(2, 1fr);
                gap: 10px;
                width: 100%;
              "
            >
              <div class="form-check" style="margin-right: 0.5rem">
                <input
                  class="form-check-input form-check-input-primary"
                  type="checkbox"
                  value="K"
                  v-model="content"
                />
                <label class="ms-2">Kitchen Orders</label>
              </div>
              <div class="form-check" style="margin-right: 0.5rem">
                <input
                  class="form-check-input form-check-input-primary"
                  type="checkbox"
                  value="B"
                  v-model="content"
                />
                <label class="ms-2">Bar Orders</label>
              </div>
              <div class="form-check" style="margin-right: 0.5rem">
                <input
                  class="form-check-input form-check-input-primary"
                  type="checkbox"
                  value="I"
                  v-model="content"
                />
                <label class="ms-2">Invoices</label>
              </div>
            </div>
          </div>
        </div>

        <div
          class="form-group row mb-2 align-items-center"
          v-if="
            branches.length &&
            choosenBranchId &&
            selectedPrinter &&
            content.length
          "
        >
          <label class="col-4"></label>
          <div class="col-8">
            <button type="button" class="btn btn-primary" @click="setBranch">
              Confirm Settings
            </button>
          </div>
        </div>
      </div>
      <div class="col-12 pt-3 text-center" v-else>
        <PrintingFlag>
          <template #action>
            <div class="text-center">
              <div class="panel">
                <div
                  style="
                    display: flex;
                    align-items: center;
                    margin-bottom: 0.125rem;
                  "
                >
                  <h4>
                    Server Url: <small>{{ url }}</small>
                  </h4>
                </div>
                <div
                  style="
                    display: flex;
                    align-items: center;
                    margin-bottom: 0.125rem;
                  "
                >
                  <h4>
                    Branch: <small>{{ branch.name }}</small>
                  </h4>
                </div>
                <div
                  style="
                    display: flex;
                    align-items: center;
                    margin-bottom: 0.125rem;
                  "
                >
                  <h4>
                    Printer: <small>{{ selectedPrinter }}</small>
                  </h4>
                </div>
                <button
                  class="btn btn-primary mt-3"
                  type="button"
                  @click="resetSettings"
                >
                  Reset Settings
                </button>
              </div>
            </div>
          </template>
        </PrintingFlag>
      </div>
    </div>
  </div>

  <div class="d-none">
    <div id="order-preview">
      <OrderPreview
        :round="printableRound"
        :order="placedOrder"
        :items="roundItems"
      />
    </div>
  </div>

  <div class="d-none">
    <div id="invoice-preview">
      <InvoicePreview :order="printedInvoice" :items="invoiceItems" />
    </div>
  </div>
</template>

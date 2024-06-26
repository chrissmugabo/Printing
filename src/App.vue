<script setup lang="ts">
import axios from "axios";
import OrderPreview from "./components/OrderPreview.vue";
import PrintingFlag from "./components/PrintingFlag.vue";
import { useLayout } from "./hooks/useLayout";
import { ref, computed, onMounted, nextTick, onBeforeMount } from "vue";
import { helper } from "./utils/helpers";

const { appSettings } = useLayout();
const invoice = ref<any>(null);
const branches = ref<any>([]);
const url = ref("");
const branch = ref<any>({});
const printableRound = ref<any>({});
const roundItems = ref<any>([]);
const printInterval = ref<any>(null);
const isFetchingRounds = ref(false);
const printingToken = ref<any>(null);
const placedOrder = ref<any>({});
const latestPrintedRoundId = ref<any>(null);
const printedInvoice = ref<any>({});
const invoiceItems = ref<any>([]);
const printingContent = ref<any>("ALL");
const choosenBranchId = ref();
const roundsUrl = computed(() => {
  if (branch.value && printingToken.value) {
    let url = latestPrintedRoundId.value
      ? `next-printable-round?print_token=${printingToken.value}&latest=${latestPrintedRoundId.value}&branch_id=${branch?.value?.id}`
      : `next-printable-round?print_token=${printingToken.value}&branch_id=${branch?.value?.id}`;
    if (printingContent.value !== "ALL") {
      url += `&category=${printingContent.value}`;
    }
    return url;
  }
  return null;
});


const _round =  {
        "id": 201,
        "category": "ORDER",
        "order_id": 70,
        "branch_id": 1,
        "items": null,
        "round_no": 114,
        "destination": "KITCHEN",
        "printed": 1,
        "created_at": "2023-12-02T23:07:00.000000Z",
        "updated_at": "2023-12-02T23:07:02.000000Z",
        "deleted_at": null
    }

   const  _order =  {
        "id": 70,
        "reference": "1KUY0Z1O",
        "category": "DINE IN",
        "system_date": "2023-12-01T22:00:00.000000Z",
        "order_time": "16:07:00",
        "table_id": 2,
        "waiter_id": 133,
        "grand_total": 2500,
        "status": "DELIVERED",
        "printed": 1,
        "client_id": null,
        "branch_id": 1,
        "receipts": null,
        "paid": 1,
        "resolved": 1,
        "paid_amount": 2500,
        "order_date": "2023-12-02 16:07:00",
        "table": {
            "id": 2,
            "name": "TABLE 2",
            "capacity": 4
        },
        "waiter": null,
        "client": null
    }

    const _items =  [
        {
            "id": 168,
            "order_id": 70,
            "item_id": 17,
            "parent_id": 0,
            "quantity": 1,
            "price": 2500,
            "amount": 2500,
            "destination": "KITCHEN",
            "round_key": 114,
            "comment": null,
            "delivered": 1,
            "created_at": "2023-12-02T23:07:00.000000Z",
            "updated_at": "2023-12-02T23:44:10.000000Z",
            "deleted_at": null,
            "name": "Beef pilao",
            "addons": []
        }
    ]


onBeforeMount(() => {
  const _url = localStorage.getItem("url");
  if (_url) {
    url.value = _url;
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
    setTimeout(() => {
      fetchInvoices();
    }, 250);
  } else {
    localStorage.removeItem("branch");
  }
}

function fetchInvoices() {
  let _printingToken = localStorage.getItem("__printing_token");
  if (!_printingToken) {
    _printingToken = Math.random().toString(36).slice(2);
    localStorage.setItem("__printing_token", _printingToken);
  }
  printingToken.value = _printingToken;
  const lastPrintedRound = localStorage.getItem("__last_printed_round");
  if (lastPrintedRound) {
    latestPrintedRoundId.value = lastPrintedRound;
  }
  setTimeout(() => {
    sessionStorage.setItem("isPrinting", "true");
    const _printingContent = localStorage.getItem("__printing_content");
    if (_printingContent) {
      printingContent.value = _printingContent;
    }
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
  }, 2000);
}
</script>
<template>
  <div class="container">
    <div class="row">
      <div class="col-12 pt-3" v-if="!Object.keys(branch).length || !url">
        <h4>Configure Printing Service</h4>
        <hr />
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
          class="form-group row mb-2 align-items-center"
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
          v-if="branches.length && choosenBranchId"
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
              <button class="btn btn-danger mt-3" type="button">
                Reset Settings
              </button>
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
</template>

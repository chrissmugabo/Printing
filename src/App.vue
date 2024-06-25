<script setup lang="ts">
import OrderPreview from "./components/OrderPreview.vue";
import axios from "axios";
import { useLayout } from "./hooks/useLayout";
import { ref, computed, onMounted, nextTick, onBeforeMount } from "vue";

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
const printingCode = ref<any>(null);
const placedOrder = ref<any>({});
const latestPrintedRoundId = ref<any>(null);
const printedInvoice = ref<any>({});
const invoiceItems = ref<any>([]);
const printingContent = ref<any>("ALL");

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

onBeforeMount(() => {
  const _url = localStorage.getItem("url");
  if (_url) {
    url.value = _url;
    const _branch = localStorage.getItem("branch");
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
      const printingTab = localStorage.getItem("__printing_tab");
      if (!printingTab) {
        localStorage.setItem(
          "__printing_tab",
          Math.random().toString(36).slice(2)
        );
        sessionStorage.setItem("isPrinting", "true");
        const _printingContent = localStorage.getItem("__printing_content");
        if (_printingContent) {
          printingContent.value = _printingContent;
        }

        printInterval.value = setInterval(() => {
          if (!isFetchingRounds.value && branch.value && roundsUrl.value) {
            isFetchingRounds.value = true;
            axios.get(roundsUrl.value).then((response) => {
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
      }
    }, 2000);
  });
});

function setUrl() {
  localStorage.setItem("url", url.value);
  axios.get(url.value + "/api/pos/pos-branches").then((response) => {
    branches.value = response.data.branches;
  });
}
function setBranch(e: any) {
  const row = branches.value.find(
    (_branch: any) => _branch.id == e.target.value
  );
  if (row) {
    branch.value = row;
    localStorage.setItem("branch", JSON.stringify(row));
  } else {
    localStorage.removeItem("branch");
  }
}
</script>

<template>
  <div class="container">
    <div class="row">
      <div class="col-12 pt-3">
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
            <select class="form-control form-select">
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

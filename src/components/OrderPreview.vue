<script setup lang="ts">
import { ref, computed } from "vue";
import { helper, printInvoice } from "../utils/helpers.js";

const props = defineProps<any>();

const orderTotal = computed(() =>
  props.items.reduce(
    (a: any, b: any) => a + Number((b.price || b.cost) * b.quantity),
    0
  )
);
const vForCallback = {
  mounted(el: any, binding: any, vnode: any) {
    let element = binding.value;
    var key = element.key;
    var len = 0;

    if (Array.isArray(element.array)) {
      len = element.array.length;
    } else if (typeof element.array === "object") {
      var keys = Object.keys(element.array);
      key = keys.indexOf(key);
      len = keys.length;
    }
    if (key == len - 1) {
      if (typeof element.callback === "function") {
        element.callback.bind(vnode.context)();
      }
    }
  },
};

function callback() {
  printInvoice("#order-preview");
}
</script>
<template>
  <div id="print-container">
    <div class="fs-5 text-center py-1 border-bottom border-dashed">
      <p class="h5 mb-1">
        <b>{{ appSettings?.site_name }} </b>
      </p>
      <p class="mb-0 h6">TIN: {{ appSettings?.app_tin }}</p>
      <p class="mb-0 h6">
        Tel: {{ appSettings?.app_phone
        }}<span v-if="appSettings?.contact_one"
          >/{{ appSettings?.contact_one }}</span
        >
      </p>
      <p class="mb-0 h6">Email:{{ appSettings?.app_email }}</p>
      <p class="mb-0 h6">Address: {{ appSettings?.site_address }}</p>
    </div>
    <div
      class="py-1 border-bottom border-dashed"
      v-if="!helper.empty(order) && !helper.empty(round)"
    >
      <table class="table table-sm table-borderless mb-1">
        <tr>
          <td colspan="2">
            <p class="mb-0 h6">
              Order NO:
              <b>#{{ helper.generateVoucherNo(round.round_no) }}</b> &rarr;
              {{ round.destination }}
            </p>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <p class="mb-0 h6">
              Customer:
              <b>{{ props.order?.client?.name || "Walk-In" }}</b>
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p class="mb-0 h6">
              Served By:
              <b>{{
                props.order?.waiter?.last_name || props.order?.waiter?.name
              }}</b>
            </p>
          </td>
          <td class="text-end text-nowrap">
            <p class="mb-0 h6">
              Table No: <b>{{ props.order?.table?.name }}</b>
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p class="mb-0 h6">
              Date: <b>{{ helper.formatDate(props.order?.order_date) }}</b>
            </p>
          </td>
          <td class="text-end text-nowrap">
            <p class="mb-0 h6">
              <b>{{ helper.formatTime(props.order?.order_date) }}</b>
            </p>
          </td>
        </tr>
      </table>
    </div>
    <div class="py-1 border-bottom border-dashed" v-if="items.length">
      <div
        class="border-bottom mb-2"
        v-for="(item, i) in props.items"
        v-for-callback="{ key: i, array: items, callback: callback() }"
        :key="'order_items' + i"
      >
        <div class="d-flex align-items-center flex-nowrap">
          <span class="text-foggy mb-0 h6">
            <span class="fw-bold d-block">{{ item.name }}</span>
            <span class="fw-normal d-block text-foggy">
              {{ item.quantity }} x {{ helper.formatNumber(item.price) }}
            </span>
          </span>
          <span class="ms-auto fw-bolder text-dark h6 mb-0">{{
            helper.formatNumber((item.price || item.cost) * item.quantity)
          }}</span>
        </div>
        <div
          class="addons-container ps-1"
          v-if="item.addons && item.addons.length > 0"
        >
          <div class="widget widget-categories">
            <ul>
              <li class="has-children">
                <ul class="collapse show py-0">
                  <li v-for="(row, k) in item.addons" :key="i + 'addon' + k">
                    <a
                      href="javascript:void(0)"
                      class="d-flex align-items-center fw-normal"
                    >
                      <span>{{ row.name }}</span>
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
        <div class="mb-1" v-if="item.comment">
          <span class="fw-bolder mb-2">Notes:</span>
          <p class="mb-0">{{ item.comment }}</p>
        </div>
      </div>
    </div>
    <div class="py-1 border-bottom border-dashed">
      <table class="table table-sm table-borderless mb-0">
        <tr>
          <td><span class="fw-bolder">Grand Total</span></td>
          <td class="text-end text-nowrap">
            <span class="h6 mb-0">{{ helper.formatMoney(orderTotal) }}</span>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

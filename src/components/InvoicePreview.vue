<script setup lang="ts">
import { helper, printInvoice } from "../utils/helpers.js";
import { useLayout } from "../hooks/useLayout";
import { ref } from "vue";

const props = defineProps<{ order: any; items: any }>();
const { appSettings } = useLayout();
const printed = ref<number[]>([]);
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
  if (props?.items?.length) {
    const id = props.order.id;
    if (!printed.value.includes(id)) {
      printed.value.push(id);
      printInvoice("invoice-preview");
    }
  }
}
</script>
<template>
  <div class="bill-container fs-5">
    <div class="fs-5 text-center py-1 border-bottom border-dashed">
      <p class="h5 mb-1">
        <b>{{ appSettings?.site_name }} </b>
      </p>
      <p class="mb-0 h6">TIN: {{ appSettings?.app_tin }}</p>
      <p class="mb-0 h6">
        Tel: {{ appSettings?.app_phone }}
        <span v-if="appSettings?.contact_one"
          >/{{ appSettings?.contact_one }}</span
        >
      </p>
      <p class="mb-0 h6">Email:{{ appSettings?.app_email }}</p>
      <p class="mb-0 h6">Address: {{ appSettings?.site_address }}</p>
    </div>
    <div class="py-1 border-bottom border-dashed" v-if="!helper.empty(order)">
      <table class="table table-sm table-borderless mb-1">
        <tr>
          <td colspan="2">
            <span class=""
              >INVOICE #:
              <b>{{ helper.generateVoucherNo(props.order?.id) }}</b></span
            >
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span class=""
              >Customer:
              <b>{{ props?.order?.client?.name || "Walk-In" }}</b></span
            >
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span class=""
              >Served By:
              <b>{{
                props.order?.waiter ? props.order?.waiter.name : "Administrator"
              }}</b></span
            >
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span class=""
              >Table: <b>{{ props?.order?.table?.name }}</b></span
            >
          </td>
        </tr>
        <tr>
          <td>
            <span
              >Date:
              <b>{{ helper.formatDate(props.order?.order_date) }}</b></span
            >
          </td>
          <td class="text-end text-nowrap">
            <span
              ><b>{{ helper.formatTime(props.order?.order_date) }}</b></span
            >
          </td>
        </tr>
      </table>
    </div>
    <div class="py-1 border-bottom border-dashed" v-if="props?.items.length">
      <table class="table table-sm table-borderless mb-1">
        <tr
          v-for="(item, i) in props?.items"
          v-for-callback="{ key: i, array: props.items, callback: callback() }"
          :key="'invoice_items' + i"
        >
          <td>
            <span>{{ item.name }}</span>
          </td>
          <td>
            <span
              >{{ item.quantity }} x {{ helper.formatNumber(item.price) }}</span
            >
          </td>
          <td class="text-end text-nowrap">
            <span>{{ helper.formatNumber(item.amount) }}</span>
          </td>
        </tr>
      </table>
    </div>

    <div class="py-1 border-bottom border-dashed">
      <table class="table table-sm table-borderless mb-0">
        <tr>
          <td><span class="fw-bolder">Grand Total</span></td>
          <td class="text-end text-nowrap">
            <span class="h6 mb-0">{{
              helper.formatMoney(props.order?.grand_total)
            }}</span>
          </td>
        </tr>
      </table>
    </div>
    <div class="py-1 text-center">
      <table class="table table-sm table-borderless mb-0">
        <tr>
          <td colspan="2">
            <span class="h5 mb-0" v-if="appSettings?.momo_code"
              >Dial {{ appSettings?.momo_code }} to pay with MOMO</span
            >
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <div class="text-center" style="font-size: 12px">
              This is not a legal receipt. Please ask your legal receipt.
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span class="h5 mb-0"> <em>Thank you!</em> </span>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

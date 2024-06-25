import { printInvoice } from "./main";

const { createApp } = Vue;

const globalMixin = {
  data: () => ({
    appSettings: {},
    url: "",
  }),
  created() {
    const _url = localStorage.getItem("url");
    if (_url) {
      this.url = _url;
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
          this.url + "/api/frontend/preloaders",
          this.generateFormData({ keys })
        )
        .then((response) => {
          this.appSettings = response.data;
        });
    }
  },
  methods: {
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
  },
};

const formatNumber = (number) => {
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
};

const empty = (mixedVar) => {
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
};

const formatDate = (str) => {
  let options = {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: this.timeZone,
  };
  let today = new Date(str);
  return today.toLocaleDateString("en-US", options);
};
const formatTime = (str) => {
  return new Date(str).toLocaleTimeString("en-US", {
    timeZone: this.timeZone,
  });
};

const formatOrderTime = (str) => {
  return new Date(str)
    .toTimeString("en-US", { timeZone: this.timeZone })
    .slice(0, 5);
};

const generateVoucherNo = (no) => {
  let len = no.toString().length;
  if (len >= 4) return no;
  if (len == 1) return `000${no}`;
  if (len == 2) return `00${no}`;
  if (len == 3) return `0${no}`;
};

const padNumber = (number, targetedLength = 5) => {
  let strNumber = number.toString();
  if (strNumber.length < targetedLength) {
    let padding = new Array(targetedLength - strNumber.length + 1).join("0");
    return padding + strNumber;
  }
  return number;
};

const formatMoney = (num) => {
  return `${this.appSettings?.currency} ${formatNumber(num)}`;
};

const app = createApp({
  mixins: [globalMixin],
  components: {
    "order-preview": {
      props: {
        order: {
          type: Object,
          required: true,
        },
        round: {
          type: Object,
          required: true,
        },
        items: {
          type: Array,
          required: true,
        },
      },
      computed: {
        orderTotal() {
          return this.items.reduce(
            (a, b) => a + Number((b.price || b.cost) * b.quantity),
            0
          );
        },
      },
      directives: {
        forCallback(el, binding, vnode) {
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
      },
      methods: {
        formatNumber,
        empty,
        formatDate,
        formatTime,
        formatOrderTime,
        generateVoucherNo,
        padNumber,
        formatMoney,
        callback() {
          printInvoice("#order-preview");
        },
      },
      template: `
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
      v-if="!empty(order) && !empty(round)"
    >
      <table class="table table-sm table-borderless mb-1">
        <tr>
          <td colspan="2">
            <p class="mb-0 h6">
              Order NO:
              <b>#{{ generateVoucherNo(round.round_no) }}</b> &rarr;
              {{ round.destination }}
            </p>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <p class="mb-0 h6">
              Customer:
              <b>{{ order?.client?.name || "Walk-In" }}</b>
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p class="mb-0 h6">
              Served By:
              <b>{{ order?.waiter?.last_name || order?.waiter?.name }}</b>
            </p>
          </td>
          <td class="text-end text-nowrap">
            <p class="mb-0 h6">
              Table No: <b>{{ order?.table?.name }}</b>
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p class="mb-0 h6">
              Date: <b>{{ formatDate(order.order_date) }}</b>
            </p>
          </td>
          <td class="text-end text-nowrap">
            <p class="mb-0 h6">
              <b>{{ formatTime(order.order_date) }}</b>
            </p>
          </td>
        </tr>
      </table>
    </div>
    <div class="py-1 border-bottom border-dashed" v-if="items.length">
      <div
        class="border-bottom mb-2"
        v-for="(item, i) in items"
        :key="'order_items' + i"
      >
        <div class="d-flex align-items-center flex-nowrap">
          <span class="text-foggy mb-0 h6">
            <span class="fw-bold d-block">{{ item.name }}</span>
            <span class="fw-normal d-block text-foggy">
              {{ item.quantity }} x {{ formatNumber(item.price) }}
            </span>
          </span>
          <span class="ms-auto fw-bolder text-dark h6 mb-0">{{
            formatNumber((item.price || item.cost) * item.quantity)
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
            <span class="h6 mb-0">{{ formatMoney(orderTotal) }}</span>
          </td>
        </tr>
      </table>
    </div>
  </div>`,
    },
    "invoice-preview": {
      props: {
        order: {
          type: Object,
          required: true,
        },
        items: {
          type: Array,
          required: true,
        },
      },
      directives: {
        forCallback(el, binding, vnode) {
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
      },
      methods: {
        formatNumber,
        empty,
        formatDate,
        formatTime,
        formatOrderTime,
        generateVoucherNo,
        padNumber,
        formatMoney,
        callback() {
          printInvoice("#invoice-preview");
        },
      },
      template: ` <div class="bill-container">
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
    <div class="py-1 border-bottom border-dashed" v-if="!empty(order)">
      <table class="table table-sm table-borderless mb-1">
        <tr>
          <td colspan="2">
            <span class=""
              >INVOICE #: <b>{{ generateVoucherNo(order.id) }}</b></span
            >
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span class=""
              >Customer: <b>{{ order?.client?.name || "Walk-In" }}</b></span
            >
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span class=""
              >Served By:
              <b>{{
                order.waiter ? order.waiter.name : "Administrator"
              }}</b></span
            >
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span class=""
              >Table: <b>{{ order?.table?.name }}</b></span
            >
          </td>
        </tr>
        <tr>
          <td>
            <span
              >Date: <b>{{ formatDate(order.order_date) }}</b></span
            >
          </td>
          <td class="text-end text-nowrap">
            <span
              ><b>{{ formatTime(order.order_date) }}</b></span
            >
          </td>
        </tr>
      </table>
    </div>
    <div class="py-1 border-bottom border-dashed" v-if="items.length">
      <table class="table table-sm table-borderless mb-1">
        <tr
          v-for="(item, i) in items"
          :key="'invoice_items' + i"
        >
          <td>
            <span>{{ item.name }}</span>
          </td>
          <td>
            <span
              >{{ item.quantity }} x
              {{ formatNumber(item.price) }}</span
            >
          </td>
          <td class="text-end text-nowrap">
            <span>{{ formatNumber(item.amount) }}</span>
          </td>
        </tr>
      </table>
    </div>

    <div class="py-1 border-bottom border-dashed">
      <table class="table table-sm table-borderless mb-0">
        <tr>
          <td><span class="fw-bolder">Grand Total</span></td>
          <td class="text-end text-nowrap">
            <span class="h6 mb-0">{{ formatMoney(order.grand_total) }}</span>
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
  </div>`,
    },
  },
  data: () => ({
    invoice: null,
    branches: [],
    url: "",
    branch: {},
    printableRound: {},
    roundItems: [],
    printInterval: null,
    isFetchingRounds: false,
    printingToken: null,
    printingCode: null,
    placedOrder: {},
    latestPrintedRoundId: null,
    printedInvoice: {},
    invoiceItems: [],
    printingContent: "ALL",
  }),
  computed: {
    roundsUrl() {
      if (this.branch && this.printingToken) {
        let url = this.latestPrintedRoundId
          ? `next-printable-round?print_token=${this.printingToken}&latest=${this.latestPrintedRoundId}&branch_id=${this.branch.id}`
          : `next-printable-round?print_token=${this.printingToken}&branch_id=${this.branch.id}`;
        if (this.printingContent !== "ALL") {
          url += `&category=${this.printingContent}`;
        }
        return url;
      }
      return null;
    },
  },
  created() {
    const _url = localStorage.getItem("url");
    if (_url) {
      this.url = _url;
      const _branch = localStorage.getItem("branch");
      if (_branch) {
        this.branch = JSON.parse(_branch);
      } else {
        axios.get(this.url + "/api/pos/pos-branches").then((response) => {
          this.branches = response.data.branches;
        });
      }
    }
  },
  methods: {
    setUrl() {
      localStorage.setItem("url", this.url);
      axios.get(this.url + "/api/pos/pos-branches").then((response) => {
        this.branches = response.data.branches;
      });
    },
    setBranch(e) {
      const row = this.branches.find((_branch) => _branch.id == e.target.value);
      if (row) {
        this.branch = row;
        localStorage.setItem("branch", JSON.stringify(row));
      } else {
        localStorage.removeItem("branch");
      }
    },
  },
  mounted() {
    this.$nextTick(() => {
      let printingToken = localStorage.getItem("__printing_token");
      if (!printingToken) {
        printingToken = Math.random().toString(36).slice(2);
        localStorage.setItem("__printing_token", printingToken);
      }
      this.printingToken = printingToken;
      const lastPrintedRound = localStorage.getItem("__last_printed_round");
      if (lastPrintedRound) {
        this.latestPrintedRoundId = lastPrintedRound;
      }
      setTimeout(() => {
        const printingTab = localStorage.getItem("__printing_tab");
        if (!printingTab) {
          localStorage.setItem(
            "__printing_tab",
            Math.random().toString(36).slice(2)
          );
          sessionStorage.setItem("isPrinting", true);
          const printingBranch = localStorage.getItem("__printing_branch");
          if (printingBranch) {
            this.printingBranch = printingBranch;
          }
          const printingContent = localStorage.getItem("__printing_content");
          if (printingContent) {
            this.printingContent = printingContent;
          }

          this.printInterval = setInterval(() => {
            if (!this.isFetchingRounds && this.branch) {
              this.isFetchingRounds = true;
              axios.get(this.roundsUrl).then((response) => {
                this.isFetchingRounds = false;
                if (response.data.status) {
                  const round = response.data.round;
                  const items = response.data.items;
                  const order = response.data.order;
                  if (round.category == "ORDER") {
                    this.printableRound = round;
                    this.roundItems = items;
                    this.placedOrder = order;
                  } else {
                    if (
                      Array.isArray(round?.items) &&
                      round?.items?.length > 0
                    ) {
                      order.grand_total = round?.items.reduce(
                        (a, b) => a + Number(b.amount),
                        0
                      );
                    }
                    this.printedInvoice = order;
                    this.invoiceItems = items;
                  }
                  this.latestPrintedRoundId = round.id;
                  localStorage.setItem(
                    "__last_printed_round",
                    this.latestPrintedRoundId
                  );
                }
              });
            }
          }, 6000);
        }
      }, 2000);
    });
  },
}).mount("#app");

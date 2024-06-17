import axios from "axios";
const { createApp, ref } = Vue;
createApp({
  setup() {
    const branches = ref([]);
    const message = ref("Hello");
    const url = ref("");
    onBeforeMount(() => {
      const _url = localStorage.getItem("url");
      if (_url) {
        url.value = _url;
      }
    });
    function setUrl() {
      localStorage.setItem("url", url.value);
      axios.get(url.value + "/api/pos/pos-branches").then((response) => {
        branches.value = response.data;
        console.log(branches.value);
      });
    }
    return {
      message,
      branches,
      url,
      setUrl,
    };
  },
}).mount("#app");

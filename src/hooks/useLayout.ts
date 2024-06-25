import { ref } from "vue";

const appSettings = ref({});
export function useLayout() {
  return {
    appSettings,
  };
}

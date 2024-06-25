import { ref } from "vue";

const appSettings = ref<any>({});
export function useLayout() {
  return {
    appSettings,
  };
}

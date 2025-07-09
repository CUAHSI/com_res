import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAlertStore = defineStore(
  'alerts',
  () => {
    let displayed = ref({})
    const need_disclaimer = ref(true)

    function displayAlert(alert) {
      displayed.value = alert
      setTimeout(function () {
        displayed.value = {}
      }, alert.duration * 1000)
    }
    function acceptDisclaimer() {
      need_disclaimer.value = false
    }

    return { displayed, displayAlert, need_disclaimer, acceptDisclaimer }
  },
  {
    persist: {
      // only persist the need_disclaimer
      // https://prazdevs.github.io/pinia-plugin-persistedstate/guide/config.html#pick
      pick: ['need_disclaimer']
    }
  }
)

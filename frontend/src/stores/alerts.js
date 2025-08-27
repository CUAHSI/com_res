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
      // We have intentionally chosen NOT to persist the disclaimer, so that it must be re-accepted every time.
      // https://cuahsi.atlassian.net/browse/CAM-810
      // https://prazdevs.github.io/pinia-plugin-persistedstate/guide/config.html#pick
      // pick: ['need_disclaimer']
    }
  }
)

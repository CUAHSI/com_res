import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAlertStore = defineStore(
  'alerts',
  () => {
    let displayed = ref({})
    const need_noaa_alert = ref(true)

    function displayAlert(alert) {
      displayed.value = alert
      setTimeout(function () {
        displayed.value = {}
      }, alert.duration * 1000)
    }
    function acceptNoaaAlert() {
      need_noaa_alert.value = false
    }

    return { displayed, displayAlert, need_noaa_alert, acceptNoaaAlert }
  },
  {
    persist: {
      // only persist the need_noaa_alert
      // https://prazdevs.github.io/pinia-plugin-persistedstate/guide/config.html#pick
      pick: ['need_noaa_alert']
    }
  }
)

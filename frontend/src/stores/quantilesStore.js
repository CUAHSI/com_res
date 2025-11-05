import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useQuantilesStore = defineStore('quantiles', () => {
  const showQuantiles = ref(false)
  const quantilesData = ref([])

  const setShowQuantiles = (value) => {
    showQuantiles.value = value
  }

  const setQuantilesData = (data) => {
    quantilesData.value = data
  }

  return {
    showQuantiles,
    quantilesData,
    setShowQuantiles,
    setQuantilesData
  }
})
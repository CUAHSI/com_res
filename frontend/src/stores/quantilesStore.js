import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useQuantilesStore = defineStore('quantiles', () => {
  const showQuantiles = ref(false)
  const quantilesData = ref([])
  const loadingQuantiles = ref(false)

  const setShowQuantiles = (value) => {
    showQuantiles.value = value
  }

  const setQuantilesData = (data) => {
    quantilesData.value = data
  }

  return {
    loadingQuantiles,
    showQuantiles,
    quantilesData,
    setShowQuantiles,
    setQuantilesData
  }
})
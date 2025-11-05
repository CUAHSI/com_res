import { defineStore } from 'pinia'
import { ref } from 'vue'

const MAX_CACHE_AGE = 24 * 60 * 60 * 1000 // 24 hours

export const useQuantilesStore = defineStore('quantiles', () => {
  const showQuantiles = ref(false)
  const quantilesData = ref([])
  const loadingQuantiles = ref(false)
  
  // Cache for quantiles data by reach_id
  const quantilesCache = ref(new Map())

  const setShowQuantiles = (value) => {
    showQuantiles.value = value

    if (!value) {
      quantilesData.value = []
    }
  }

  const setQuantilesData = (data) => {
    quantilesData.value = data
  }

  const cacheQuantilesData = (reachId, data) => {
    quantilesCache.value.set(reachId, {
      data,
      timestamp: Date.now()
    })
  }

  const getCachedQuantilesData = (reachId, maxAge = MAX_CACHE_AGE) => {
    const cached = quantilesCache.value.get(reachId)
    if (!cached) return null
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > maxAge) {
      quantilesCache.value.delete(reachId)
      return null
    }
    
    return cached.data
  }

  const hasCachedQuantilesData = (reachId, maxAge = MAX_CACHE_AGE) => {
    const cached = quantilesCache.value.get(reachId)
    return cached && (Date.now() - cached.timestamp <= maxAge)
  }

  // Clear cache if needed (optional - for memory management)
  const clearCache = () => {
    quantilesCache.value.clear()
  }

  // Clear cache for a specific reach_id (optional)
  const clearCacheForReach = (reachId) => {
    quantilesCache.value.delete(reachId)
  }

  return {
    loadingQuantiles,
    showQuantiles,
    quantilesData,
    quantilesCache,
    setShowQuantiles,
    setQuantilesData,
    cacheQuantilesData,
    getCachedQuantilesData,
    hasCachedQuantilesData,
    clearCache,
    clearCacheForReach
  }
})
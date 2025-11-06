import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_BASE } from '@/constants'
import { useAlertStore } from '@/stores/alerts'

const MAX_CACHE_AGE = 24 * 60 * 60 * 1000 // 24 hours

export const useQuantilesStore = defineStore('quantiles', () => {
  const showQuantiles = ref(false)
  const quantilesData = ref([])
  const loadingQuantiles = ref(false)
  const showLegend = ref(true)
  
  // Cache for quantiles data by reach_id
  const quantilesCache = ref(new Map())

  const setShowQuantiles = async (value, reach_id) => {
    showQuantiles.value = value

    if (!value) {
      quantilesData.value = []
    }else{
      if (quantilesData.value.length === 0) {
        await getQuantilesData(reach_id)
      }
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

  // Fetch quantiles data from the FastAPI endpoint
  const getQuantilesData = async (reach_id) => {
    if (!reach_id) return

    // Check if we have cached data for this reach_id
    if (hasCachedQuantilesData(reach_id)) {
      const cachedData = getCachedQuantilesData(reach_id)
      setQuantilesData(cachedData)
      return
    }
    
    try {
      loadingQuantiles.value = true
      const response = await fetch(`${API_BASE}/timeseries/historical-quantiles?feature_id=${reach_id}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()

      // if the data is empty, return
      if (!data || data.length === 0) {
        const alertStore = useAlertStore()
        alertStore.displayAlert({
          title: 'No Quantiles Data',
          text: 'No quantiles data available for the selected reach.',
          type: 'error',
          closable: true,
          duration: 3
        })

        loadingQuantiles.value = false
        // clear the quantiles display
        setShowQuantiles(false, reach_id)
        return
      }
      
      // Get current year for date alignment
      const currentYear = new Date().getFullYear()
      
      // Create the base Q0 data (hidden from legend and tooltips)
      const q0Data = data.map(item => {
        const date = new Date(currentYear, 0)
        date.setDate(item.doy)
        return { x: date.toISOString().split('T')[0], y: item.q0 }
      })
      
      // Transform the quantiles data for the chart - use actual dates for current year
      const transformedQuantiles = [
        {
          // Hidden Q0 dataset - serves as the base for fills but doesn't show in legend/tooltips
          label: '', // Empty label to hide from legend
          data: q0Data,
          borderColor: 'transparent', // Make border invisible
          backgroundColor: 'transparent', // Make background invisible
          pointRadius: 0, // No points
          pointHoverRadius: 0, // No hover points
          borderWidth: 0, // No border
          fill: true, // This will be the base fill
          showLine: false, // Don't show the line
          hidden: false, // Keep it visible for filling purposes
          // Hide from tooltips and legend
          tooltip: {
            enabled: false
          }
        },
        {
          label: 'Much Below Normal',
          data: data.map(item => {
            const date = new Date(currentYear, 0)
            date.setDate(item.doy)
            return { x: date.toISOString().split('T')[0], y: item.q10 }
          }),
          borderColor: 'darkred',
          backgroundColor: 'rgba(139, 0, 0, 0.3)', // Semi-transparent darkred
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: {
            target: '-1', // Fill to the previous dataset (Q0)
            above: 'rgba(139, 0, 0, 0.3)' // Fill color for the area
          },
          tension: 0.1
        },
        {
          label: 'Below Normal',
          data: data.map(item => {
            const date = new Date(currentYear, 0)
            date.setDate(item.doy)
            return { x: date.toISOString().split('T')[0], y: item.q25 }
          }),
          borderColor: 'darkorange',
          backgroundColor: 'rgba(255, 140, 0, 0.3)', // Semi-transparent darkorange
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: {
            target: '-1', // Fill to the previous dataset (Q10)
            above: 'rgba(255, 140, 0, 0.3)' // Fill color for the area
          },
          tension: 0.1
        },
        {
          label: 'Normal',
          data: data.map(item => {
            const date = new Date(currentYear, 0)
            date.setDate(item.doy)
            return { x: date.toISOString().split('T')[0], y: item.q75 }
          }),
          borderColor: 'darkgreen',
          backgroundColor: 'rgba(0, 100, 0, 0.3)', // Semi-transparent darkgreen
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: {
            target: '-1', // Fill to the previous dataset (Q25)
            above: 'rgba(0, 100, 0, 0.3)' // Fill color for the area
          },
          tension: 0.1
        },
        {
          label: 'Above Normal',
          data: data.map(item => {
            const date = new Date(currentYear, 0)
            date.setDate(item.doy)
            return { x: date.toISOString().split('T')[0], y: item.q90 }
          }),
          borderColor: 'darkblue',
          backgroundColor: 'rgba(0, 0, 139, 0.3)', // Semi-transparent darkblue
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: {
            target: '-1', // Fill to the previous dataset (Q75)
            above: 'rgba(0, 0, 139, 0.3)' // Fill color for the area
          },
          tension: 0.1
        }
      ]
      
      // Cache the data for future use
      cacheQuantilesData(reach_id, transformedQuantiles)
      
      // Set the shared quantiles data in Pinia store
      setQuantilesData(transformedQuantiles)

    } catch (err) {
      console.error('Failed to load quantiles data:', err)
    } finally {
      loadingQuantiles.value = false
    }
  }

  // Toggle quantiles display - uses the shared store so both plots stay synchronized
  const toggleQuantiles = (reach_id) => {
    setShowQuantiles(!showQuantiles.value, reach_id)
  }

  // Toggle legend visibility
  const toggleLegend = () => {
    showLegend.value = !showLegend.value
  }

  return {
    loadingQuantiles,
    showQuantiles,
    quantilesData,
    quantilesCache,
    showLegend,
    getQuantilesData,
    setShowQuantiles,
    setQuantilesData,
    cacheQuantilesData,
    getCachedQuantilesData,
    hasCachedQuantilesData,
    clearCache,
    clearCacheForReach,
    toggleLegend,
    toggleQuantiles,
  }
})
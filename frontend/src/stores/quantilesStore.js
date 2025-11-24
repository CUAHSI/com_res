import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_BASE } from '@/constants'

const MAX_CACHE_AGE = 24 * 60 * 60 * 1000 // 24 hours
export const useQuantilesStore = defineStore('quantiles', () => {
  const quantilesData = ref({
    historical: [],
    forecast: []
  })

  // Cache for quantiles data by reach_id and plot type
  const quantilesCache = ref(new Map())

  const setQuantilesData = async (data, plotType = 'historical') => {
    quantilesData.value[plotType] = data
  }

  const cacheQuantilesData = (reachId, data, plotType = 'historical') => {
    const cacheKey = `${reachId}_${plotType}`
    quantilesCache.value.set(cacheKey, {
      data,
      timestamp: Date.now()
    })
  }

  const getCachedQuantilesData = (reachId, plotType = 'historical', maxAge = MAX_CACHE_AGE) => {
    const cacheKey = `${reachId}_${plotType}`
    const cached = quantilesCache.value.get(cacheKey)
    if (!cached) return null

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > maxAge) {
      quantilesCache.value.delete(cacheKey)
      return null
    }

    return cached.data
  }

  const hasCachedQuantilesData = (reachId, plotType = 'historical', maxAge = MAX_CACHE_AGE) => {
    const cacheKey = `${reachId}_${plotType}`
    const cached = quantilesCache.value.get(cacheKey)
    return cached && Date.now() - cached.timestamp <= maxAge
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
  const getQuantilesData = async (
    reach_id,
    startDate = null,
    endDate = null,
    plotType = 'historical'
  ) => {
    if (!reach_id) return

    // Generate a cache key that includes the date range and plot type
    const cacheKey = `${reach_id}_${plotType}_${startDate}_${endDate}`

    // Check if we have cached data for this reach_id and date range
    if (hasCachedQuantilesData(cacheKey)) {
      const cachedData = getCachedQuantilesData(cacheKey)
      setQuantilesData(cachedData, plotType)
      return true
    }

    try {
      const response = await fetch(
        `${API_BASE}/timeseries/historical-quantiles?feature_id=${reach_id}`
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // if the data is empty, return
      if (!data || data.length === 0) {
        return false
      }

      // Determine the date range
      let start, end
      if (startDate && endDate) {
        // Use the provided date range
        start = new Date(startDate)
        end = new Date(endDate)
      } else {
        // Default behavior based on plot type
        if (plotType === 'forecast') {
          // For forecast plot, show current year + next year to cover forecast range
          const currentYear = new Date().getFullYear()
          start = new Date(currentYear, 0, 1) // Jan 1 of current year
          end = new Date(currentYear + 1, 11, 31) // Dec 31 of next year
        } else {
          // For historical plot, default to current year
          const currentYear = new Date().getFullYear()
          start = new Date(currentYear, 0, 1) // Jan 1 of current year
          end = new Date(currentYear, 11, 31) // Dec 31 of current year
        }
      }

      // Generate all dates in the range
      const allDates = generateDateRange(start, end)

      // Create a lookup map for quantile data by day of year
      const quantilesByDoy = {}
      data.forEach((item) => {
        quantilesByDoy[item.doy] = item
      })

      // Function to get quantile value for a specific date
      const getQuantileForDate = (date, quantileField) => {
        const doy = getDayOfYear(date)
        const quantileData = quantilesByDoy[doy]
        return quantileData ? quantileData[quantileField] : null
      }

      // Create the base Q0 data (hidden from legend and tooltips)
      const q0Data = allDates.map((date) => {
        return {
          x: date.toISOString().split('T')[0],
          y: getQuantileForDate(date, 'q0')
        }
      })

      // Transform the quantiles data for the chart for the full date range
      const transformedQuantiles = [
        {
          // Hidden Q0 dataset - serves as the base for fills but doesn't show in legend/tooltips
          label: '', // Empty label to hide from legend
          data: q0Data,
          borderColor: 'transparent',
          backgroundColor: 'transparent',
          pointRadius: 0,
          pointHoverRadius: 0,
          borderWidth: 0,
          fill: true,
          showLine: false,
          hidden: false,
          tooltip: { enabled: false }
        },
        {
          label: 'Much Below Normal',
          data: allDates.map((date) => {
            return {
              x: date.toISOString().split('T')[0],
              y: getQuantileForDate(date, 'q10')
            }
          }),
          borderColor: 'darkred',
          backgroundColor: 'rgba(139, 0, 0, 0.3)',
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: { target: '-1', above: 'rgba(139, 0, 0, 0.3)' },
          tension: 0.1
        },
        {
          label: 'Below Normal',
          data: allDates.map((date) => {
            return {
              x: date.toISOString().split('T')[0],
              y: getQuantileForDate(date, 'q25')
            }
          }),
          borderColor: 'darkorange',
          backgroundColor: 'rgba(255, 140, 0, 0.3)',
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: { target: '-1', above: 'rgba(255, 140, 0, 0.3)' },
          tension: 0.1
        },
        {
          label: 'Normal',
          data: allDates.map((date) => {
            return {
              x: date.toISOString().split('T')[0],
              y: getQuantileForDate(date, 'q75')
            }
          }),
          borderColor: 'darkgreen',
          backgroundColor: 'rgba(0, 100, 0, 0.3)',
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: { target: '-1', above: 'rgba(0, 100, 0, 0.3)' },
          tension: 0.1
        },
        {
          label: 'Above Normal',
          data: allDates.map((date) => {
            return {
              x: date.toISOString().split('T')[0],
              y: getQuantileForDate(date, 'q90')
            }
          }),
          borderColor: 'darkblue',
          backgroundColor: 'rgba(0, 0, 139, 0.3)',
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: { target: '-1', above: 'rgba(0, 0, 139, 0.3)' },
          tension: 0.1
        }
      ]

      // Cache the data for future use
      cacheQuantilesData(cacheKey, transformedQuantiles)

      // Set the shared quantiles data in Pinia store for the specific plot type
      setQuantilesData(transformedQuantiles, plotType)
    } catch (err) {
      console.error('Failed to load quantiles data:', err)
      return false
    }
    return true
  }

  // Helper function to generate all dates in a range
  const generateDateRange = (start, end) => {
    const dates = []
    const current = new Date(start)

    while (current <= end) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return dates
  }

  // Helper function to get day of year (1-365/366)
  const getDayOfYear = (date) => {
    const start = new Date(date.getFullYear(), 0, 0)
    const diff = date - start
    const oneDay = 1000 * 60 * 60 * 24
    return Math.floor(diff / oneDay)
  }

  return {
    quantilesData,
    quantilesCache,
    getQuantilesData,
    setQuantilesData,
    cacheQuantilesData,
    getCachedQuantilesData,
    hasCachedQuantilesData,
    clearCache,
    clearCacheForReach
  }
})

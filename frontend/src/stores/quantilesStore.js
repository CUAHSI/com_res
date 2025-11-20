import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_BASE } from '@/constants'

const MAX_CACHE_AGE = 24 * 60 * 60 * 1000 // 24 hours

export const useQuantilesStore = defineStore('quantiles', () => {
  const quantilesData = ref([])

  // Cache for quantiles data by reach_id
  const quantilesCache = ref(new Map())

  const setQuantilesData = async (data) => {
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
  const getQuantilesData = async (reach_id, startDate = null, endDate = null) => {
    if (!reach_id) return

    // Generate a cache key that includes the date range
    const cacheKey = `${reach_id}_${startDate}_${endDate}`
    
    // Check if we have cached data for this reach_id and date range
    if (hasCachedQuantilesData(cacheKey)) {
      const cachedData = getCachedQuantilesData(cacheKey)
      setQuantilesData(cachedData)
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
        // Default to current year if no range provided
        const currentYear = new Date().getFullYear()
        start = new Date(currentYear, 0, 1) // Jan 1 of current year
        end = new Date(currentYear, 11, 31) // Dec 31 of current year
      }

      // Generate all dates in the range
      const allDates = generateDateRange(start, end)
      
      // Create a lookup map for quantile data by day of year
      const quantilesByDoy = {}
      data.forEach(item => {
        quantilesByDoy[item.doy] = item
      })

      // Function to get quantile value for a specific date
      const getQuantileForDate = (date, quantileField) => {
        const doy = getDayOfYear(date)
        const quantileData = quantilesByDoy[doy]
        return quantileData ? quantileData[quantileField] : null
      }

      // Create the base Q0 data (hidden from legend and tooltips)
      const q0Data = allDates.map(date => {
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
          data: allDates.map(date => {
            return { 
              x: date.toISOString().split('T')[0], 
              y: getQuantileForDate(date, 'q10')
            }
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
          data: allDates.map(date => {
            return { 
              x: date.toISOString().split('T')[0], 
              y: getQuantileForDate(date, 'q25')
            }
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
          data: allDates.map(date => {
            return { 
              x: date.toISOString().split('T')[0], 
              y: getQuantileForDate(date, 'q75')
            }
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
          data: allDates.map(date => {
            return { 
              x: date.toISOString().split('T')[0], 
              y: getQuantileForDate(date, 'q90')
            }
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
      cacheQuantilesData(cacheKey, transformedQuantiles)

      // Set the shared quantiles data in Pinia store
      setQuantilesData(transformedQuantiles)
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

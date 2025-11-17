<template>
  <v-card
    v-if="show"
    class="mx-auto"
    :class="{ 'full-screen': isFullScreen, 'plot-card': isFullScreen }"
    elevation="8"
  >
    <v-skeleton-loader
      v-if="isLoading"
      type="heading, image "
      :loading="isLoading"
      class="mx-auto"
    ></v-skeleton-loader>
    <div v-if="!isLoading" class="position-absolute" style="top: 6px; right: 8px; z-index: 2">
      <InfoTooltip
        content-class="plot-info-tooltip"
        :z-index="200000"
        :max-width="420"
        iconSize="x-small"
        style="margin-left: 4px"
        text="This graph shows streamflow (in cubic feet per second) forecasted over the
        next 10 days.  
        If you see a high flow on this graph, and would like more information on flood
        risk in this area, please visit water.noaa.gov to view Flood Impact Statements 
        (for guidance, go to FloodSavvy's RESOURCES page) or consider contacting the local
        National Weather Forecast Office. If this graph has a zero value, this means the
        river you selected is intermittent, and only has brief periods of streamflow after
        heavy rainfall occurs upstream. 
        This data comes from the medium-range simulations of the National Water Model. 
        The forecast shown here represents just one possible scenario, extending out to 10 days.
        To learn more about how this information is modeled or how to access and retrieve the data, 
        please visit: 
        https://www.sciencedirect.com/science/article/pii/S1364815224001841"
      />
    </div>
    <v-row v-if="isLoading" justify="center" align="center" class="mt-4">
      <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
      <span class="ml-3">Loading forecasted data...</span>
    </v-row>
    <v-row v-if="!hasData && !isLoading" justify="center" align="center" class="mt-4">
      <span class="ml-3">No forecasted data available.</span>
    </v-row>
    <div class="plot-container" :style="plotContainerStyle">
      <LinePlot
        v-if="!isLoading && hasData"
        :timeseries="plot_timeseries"
        :quantiles="showQuantiles ? quantilesData : []"
        :iqr="showIQR ? iqrData : []"
        :title="plot_title"
        :use-log-scale="showQuantiles"
        :show-legend="showLegend"
      />
    </div>
    <v-card-actions class="card-actions" :class="{ 'full-screen-actions': isFullScreen }">
      <!-- Legend Toggle Button -->
      <v-tooltip v-if="showLegendToggle" location="bottom" max-width="200px" class="chart-tooltip">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            v-if="plot_timeseries.length > 0 && !isLoading && (showQuantiles || showIQR)"
            :color="showLegend ? 'primary' : 'default'"
            @click="toggleLegend"
            icon
            size="small"
            class="mr-1"
          >
            <v-icon :icon="showLegend ? mdiEyeOff : mdiEye"></v-icon>
          </v-btn>
        </template>
        <span>{{ showLegend ? 'Hide' : 'Show' }} Legend</span>
      </v-tooltip>

      <!-- IQR Toggle Button -->
      <v-tooltip location="bottom" max-width="200px" class="chart-tooltip">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            v-if="plot_timeseries.length > 0 && !isLoading"
            :color="showIQR ? 'primary' : 'default'"
            :disabled="loadingIQR"
            :loading="loadingIQR"
            @click="toggleIQR(reach_id)"
            icon
            size="small"
            class="mr-1"
          >
            <v-icon :icon="mdiChartBox"></v-icon>
            <v-progress-circular
              v-if="loadingIQR"
              indeterminate
              color="white"
              size="20"
            ></v-progress-circular>
          </v-btn>
        </template>
        <span>{{ showIQR ? 'Hide' : 'Show' }} Forecast IQR</span>
      </v-tooltip>

      <!-- Quantiles Toggle Button -->
      <v-tooltip location="bottom" max-width="200px" class="chart-tooltip">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            v-if="plot_timeseries.length > 0 && !isLoading"
            :color="showQuantiles ? 'primary' : 'default'"
            :disabled="quantilesFailed"
            :loading="loadingQuantiles"
            @click="toggleQuantiles(reach_id)"
            icon
            size="small"
            class="mr-1"
          >
            <v-icon :icon="mdiChartAreaspline"></v-icon>
            <v-progress-circular
              v-if="loadingQuantiles"
              indeterminate
              color="white"
              size="20"
            ></v-progress-circular>
          </v-btn>
        </template>
        <span>{{ showQuantiles ? 'Hide' : 'Show' }} Historical Quantiles</span>
      </v-tooltip>

      <!-- CSV Download Button -->
      <v-tooltip location="bottom" max-width="200px" class="chart-tooltip">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            v-if="plot_timeseries.length > 0 && !isLoading"
            :disabled="downloading.csv"
            :loading="downloading.csv"
            @click="downCSV"
            icon
            size="small"
            class="mr-1"
          >
            <v-icon :icon="mdiFileDelimited"></v-icon>
            <v-progress-circular
              v-if="downloading.csv"
              indeterminate
              color="white"
              size="20"
            ></v-progress-circular>
          </v-btn>
        </template>
        <span>Download CSV</span>
      </v-tooltip>

      <!-- JSON Download Button -->
      <v-tooltip location="bottom" max-width="200px" class="chart-tooltip">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            v-if="plot_timeseries.length > 0 && !isLoading"
            :disabled="downloading.json"
            :loading="downloading.json"
            @click="downJson"
            icon
            size="small"
          >
            <v-icon :icon="mdiCodeJson"></v-icon>
            <v-progress-circular
              v-if="downloading.json"
              indeterminate
              color="white"
              size="20"
            ></v-progress-circular>
          </v-btn>
        </template>
        <span>Download JSON</span>
      </v-tooltip>
      <!-- Full Screen Button -->
      <v-tooltip location="bottom" max-width="200px" class="chart-tooltip">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            v-if="plot_timeseries.length > 0 && !isLoading"
            @click="toggleFullScreen"
            icon
            size="small"
            class="mr-1"
          >
            <v-icon :icon="isFullScreen ? mdiFullscreenExit : mdiFullscreen"></v-icon>
          </v-btn>
        </template>
        <span>{{ isFullScreen ? 'Exit' : 'Enter' }} Full Screen</span>
      </v-tooltip>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import 'chartjs-adapter-date-fns'
import LinePlot from '@/components/LinePlot.vue'
import { ref, defineExpose, watch, toRef, computed } from 'vue'
import {
  mdiChartAreaspline,
  mdiEye,
  mdiEyeOff,
  mdiChartBox,
  mdiCodeJson,
  mdiFileDelimited,
  mdiFullscreenExit,
  mdiFullscreen
} from '@mdi/js'
import { API_BASE } from '@/constants'
import InfoTooltip from '@/components/InfoTooltip.vue'
import { useQuantilesStore } from '@/stores/quantilesStore'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Filler
} from 'chart.js'
import { storeToRefs } from 'pinia'

// Use Pinia store
const quantilesStore = useQuantilesStore()
const { quantilesData } = storeToRefs(quantilesStore)
const showQuantiles = ref(false)
const loadingQuantiles = ref(false)
const quantilesFailed = ref(false)
const showLegend = ref(false)
const isFullScreen = ref(false)

// New IQR state
const showIQR = ref(false)
const loadingIQR = ref(false)
const iqrData = ref([])

const emit = defineEmits(['toggleFullScreen'])

const showLegendToggle = computed(() => {
  return (showQuantiles.value || showIQR.value) && !loadingQuantiles.value && !loadingIQR.value
})

const plotContainerStyle = computed(() => {
  if (isFullScreen.value) {
    return {
      height: 'calc(100vh - 80px)',
      width: '100%'
    }
  } else {
    return {
      height: 'calc(23vh)',
      width: '100%'
    }
  }
})

const setShowQuantiles = async (value, reach_id) => {
  // If turning on quantiles, turn off IQR
  if (value) {
    showIQR.value = false
    iqrData.value = []
  }

  showQuantiles.value = value
  quantilesFailed.value = false
  if (value && quantilesData.value.length === 0) {
    loadingQuantiles.value = true
    quantilesFailed.value = !(await quantilesStore.getQuantilesData(reach_id))
  }
  loadingQuantiles.value = false
}

// Toggle quantiles display - uses the shared store so both plots stay synchronized
const toggleQuantiles = (reach_id) => {
  setShowQuantiles(!showQuantiles.value, reach_id)
}

// Toggle IQR display
const toggleIQR = async (reach_id) => {
  const newValue = !showIQR.value

  // If turning on IQR, turn off quantiles
  if (newValue) {
    showQuantiles.value = false
  }

  showIQR.value = newValue

  if (newValue && iqrData.value.length === 0) {
    await fetchIQRData(reach_id)
  } else if (!newValue) {
    iqrData.value = []
  }
}

// Fetch IQR data from the summarized forecast endpoint
const fetchIQRData = async (reach_id) => {
  try {
    loadingIQR.value = true
    const params = new URLSearchParams({
      reach_id: reach_id,
      date_time: datetime.value.toISOString().split('T')[0],
      forecast: forecast_mode.value
    })

    const response = await fetch(
      `${API_BASE}/timeseries/get-summarized-nwm-forecast?${params.toString()}`
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Transform the data to match the expected format for LinePlot
    if (data.timestamp && data.mean && data.q25 && data.q75) {
      iqrData.value = [
        {
          label: 'Mean Forecast',
          data: data.timestamp.map((timestamp, index) => ({
            x: timestamp,
            y: data.mean[index]
          })),
          borderColor: 'rgba(0, 0, 0, 1)', // Black line for mean forecast
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          fill: false,
          tension: 0.4, // Smooth line like the original streamflow
          pointRadius: 0, // turn off points
          borderWidth: 2
        },
        {
          label: '75th Percentile',
          data: data.timestamp.map((timestamp, index) => ({
            x: timestamp,
            y: data.q75[index]
          })),
          borderColor: 'rgba(70, 130, 180, 0.8)',
          backgroundColor: 'rgba(128, 128, 128, 0.1)',
          fill: false,
          pointRadius: 0, // turn off points
          tension: 0.1, // Less smooth for bounds
          borderDash: [5, 5],
          borderWidth: 1
        },
        {
          label: '25th Percentile',
          data: data.timestamp.map((timestamp, index) => ({
            x: timestamp,
            y: data.q25[index]
          })),
          borderColor: 'rgba(165, 42, 42, 0.8)',
          backgroundColor: 'rgba(128, 128, 128, 0.1)',
          fill: '-1', // Fill to the previous dataset (q75)
          pointRadius: 0, // turn off points
          tension: 0.1, // Less smooth for bounds
          borderDash: [2, 2],
          borderWidth: 1
        }
      ]
    }
  } catch (err) {
    console.error('Failed to fetch IQR data:', err)
    showIQR.value = false
  } finally {
    loadingIQR.value = false
  }
}

const toggleFullScreen = () => {
  isFullScreen.value = !isFullScreen.value
  emit('toggleFullScreen', isFullScreen.value)
}

// Toggle legend visibility
const toggleLegend = () => {
  showLegend.value = !showLegend.value
}

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, TimeScale, Filler)

const plot_timeseries = ref([])
const plot_title = ref()
const plot_style = ref()
const isLoading = ref(false)
const hasData = ref(false)
const downloading = ref({ json: false, csv: false })
const error = ref(null)

const props = defineProps({
  reachid: Number,
  reachname: String,
  forecast_datetime: {
    type: Date,
    default: () => new Date(Date.now() - 24 * 60 * 60 * 1000) // default = yesterday
  },
  forecast_mode: {
    type: String,
    default: 'medium_range'
  },
  forecast_ensemble: {
    type: String,
    default: '3'
  },
  show: {
    type: Boolean,
    required: true
  }
})

const reach_id = toRef(props, 'reachid')
const reach_name = toRef(props, 'reachname')
const datetime = toRef(props, 'forecast_datetime')
const forecast_mode = toRef(props, 'forecast_mode')
const ensemble = toRef(props, 'forecast_ensemble')

const clearPlot = () => {
  plot_timeseries.value = []
  plot_title.value = ''
  plot_style.value = {}
  iqrData.value = []
  showIQR.value = false
  showQuantiles.value = false
}

watch([reach_id, reach_name, datetime, forecast_mode, ensemble], async () => {
  console.log('Current props:', {
    reach_id: reach_id.value,
    reach_name: reach_name.value,
    datetime: datetime.value,
    forecast_mode: forecast_mode.value,
    ensemble: ensemble.value
  })
  if (reach_id.value && datetime.value) {
    await getForecastData(
      reach_id.value,
      reach_name.value,
      datetime.value,
      forecast_mode.value,
      ensemble.value
    )
    // Fetch new quantiles when reach ID changes
    loadingQuantiles.value = true
    quantilesFailed.value = false
    if (showQuantiles.value) {
      await quantilesStore.setQuantilesData([])
      quantilesFailed.value = !(await quantilesStore.getQuantilesData(reach_id.value))
    }
    loadingQuantiles.value = false

    // Fetch new IQR data when reach ID changes
    if (showIQR.value) {
      await fetchIQRData(reach_id.value)
    }
  }
})

const getForecastData = async (reach_id, name, datetime, forecast_mode, ensemble) => {
  try {
    isLoading.value = true
    error.value = null

    const params = new URLSearchParams({
      reach_id: reach_id,
      date_time: datetime.toISOString().split('T')[0],
      forecast: forecast_mode,
      ensemble: ensemble
    })
    console.log(reach_id, name, datetime, forecast_mode, ensemble)
    const response = await fetch(`${API_BASE}/timeseries/nwm-forecast?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    let formattedData = Object.entries(data).map(([x, y]) => ({ x, y }))
    hasData.value = formattedData.length > 0
    plot_timeseries.value = formattedData
  } catch (err) {
    error.value = `Failed to load data: ${err.message}`
    console.error('API error:', err)
  } finally {
    isLoading.value = false
  }

  plot_title.value = 'Forecasted Streamflow - ' + reach_name.value
}

async function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const downJson = async () => {
  downloading.value.json = true
  const jsonData = JSON.stringify(plot_timeseries.value, null, 2)
  const blob = new Blob([jsonData], { type: 'application/json' })
  let filename = getFileName('json')
  await downloadBlob(blob, filename)
  downloading.value.json = false
  trackEvent('Download Forecast JSON Button Clicked', {
    reach_id: reach_id.value,
    reach_name: reach_name.value
  })
}

const downCSV = async () => {
  downloading.value.csv = true

  // Convert timeseries data to CSV format
  const headers = 'Date,Streamflow\n'
  const csvRows = plot_timeseries.value.map((item) => `"${item.x}","${item.y}"`).join('\n')

  const csvData = headers + csvRows
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
  let filename = getFileName('csv')
  await downloadBlob(blob, filename)
  downloading.value.csv = false

  trackEvent('Download Forecast CSV Button Clicked', {
    reach_id: reach_id.value,
    reach_name: reach_name.value
  })
}

const trackEvent = (eventName, eventData = {}) => {
  try {
    if (window.heap) {
      window.heap.track(eventName, eventData)
    } else {
      console.warn('Heap is not available. Event not tracked:', eventName)
    }
  } catch (error) {
    console.error('Error tracking event:', eventName, error)
  }
}

const getFileName = (extension) => {
  const date = new Date().toISOString().split('T')[0]
  let filename = `${plot_title.value}${date}`
  return `${filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`
}

defineExpose({
  getForecastData,
  clearPlot
})
</script>

<style scoped>
.chart-tooltip {
  z-index: 99999 !important;
}

.chart-tooltip span {
  white-space: normal;
  word-break: normal;
}

.plot-card {
  transition: all 0.3s ease;
  height: calc(30vh);
  width: 100%;
  display: flex;
  flex-direction: column;
}

.plot-card.full-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw !important;
  height: 100vh !important;
  z-index: var(--z-index-plots) !important;
  margin: 0;
  max-width: none !important;
  max-height: none !important;
}

.plot-container {
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: var(--z-index-plots) !important;
}

.card-actions {
  justify-content: flex-end;
  gap: 8px;
  padding-top: 20px;
}

/* When in full screen, ensure body doesn't scroll */
body.no-scroll {
  overflow: hidden;
}
</style>

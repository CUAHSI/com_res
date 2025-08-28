<template>
  <v-card v-if="show" class="mx-auto" elevation="8" style="height: calc(30vh); width: 100%">
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
    <LinePlot
      v-if="!isLoading && hasData"
      :timeseries="plot_timeseries"
      :title="plot_title"
      :style="plot_style"
    />
    <v-card-actions class="position-relative" style="justify-content: flex-end; gap: 8px">
      <!-- CSV Download Button -->
      <v-tooltip location="bottom" max-width="200px" class="chart-tooltip">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            v-if="plot_timeseries.length > 0 && !isLoading"
            color="primary"
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

      <!-- JSON Download Button (existing) -->
      <v-tooltip location="bottom" max-width="200px" class="chart-tooltip">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            v-if="plot_timeseries.length > 0 && !isLoading"
            color="primary"
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
    </v-card-actions>
  </v-card>
</template>

<script setup>
import 'chartjs-adapter-date-fns'
import LinePlot from '@/components/LinePlot.vue'
import { ref, defineExpose, watch, toRef } from 'vue'
import { API_BASE } from '@/constants'
import { mdiCodeJson, mdiFileDelimited } from '@mdi/js'
import InfoTooltip from '@/components/InfoTooltip.vue'
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
  }
})

const clearPlot = () => {
  plot_timeseries.value = []
  plot_title.value = ''
  plot_style.value = {}
}

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
</style>

<template>
  <v-card v-if="show" class="mx-auto" elevation="8" style="height: calc(30vh); width: 100%">
    <v-skeleton-loader v-if="isLoading" type="heading, image " :loading="isLoading" class="mx-auto"></v-skeleton-loader>
    <v-row v-if="isLoading" justify="center" align="center" class="mt-4">
      <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
      <span class="ml-3">Loading forecasted data...</span>
    </v-row>
    <v-row v-if="!hasData && !isLoading" justify="center" align="center" class="mt-4">
      <span class="ml-3">No forecasted data available.</span>
    </v-row>
    <LinePlot v-if="!isLoading && hasData" :timeseries="plot_timeseries" :title="plot_title" :style="plot_style" />
    <v-card-actions class="position-relative">
      <!-- CSV Download Button -->
      <v-tooltip location="bottom" max-width="200px" class="chart-tooltip">
        <template #activator="{ props }">
          <v-btn v-bind="props" v-if="plot_timeseries.length > 0 && !isLoading" color="primary"
            :disabled="downloading.csv" :loading="downloading.csv" @click="downCSV" icon size="small" class="mr-1">
            <v-icon :icon="mdiFileDelimited"></v-icon>
            <v-progress-circular v-if="downloading.csv" indeterminate color="white" size="20"></v-progress-circular>
          </v-btn>
        </template>
        <span>Download CSV</span>
      </v-tooltip>
      
      <!-- JSON Download Button (existing) -->
      <v-tooltip location="bottom" max-width="200px" class="chart-tooltip">
        <template #activator="{ props }">
          <v-btn v-bind="props" v-if="plot_timeseries.length > 0 && !isLoading" color="primary"
            :disabled="downloading.json" :loading="downloading.json" @click="downJson" icon size="small">
            <v-icon :icon="mdiCodeJson"></v-icon>
            <v-progress-circular v-if="downloading.json" indeterminate color="white" size="20"></v-progress-circular>
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
import { ref, defineExpose } from 'vue'
import { API_BASE } from '@/constants'
import { mdiCodeJson, mdiFileDelimited } from '@mdi/js'
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

  plot_title.value = 'Forecasted Streamflow - ' + name
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
  const csvRows = plot_timeseries.value.map(item => 
    `"${item.x}","${item.y}"`
  ).join('\n')
  
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

defineProps({
  show: {
    type: Boolean,
    required: true
  }
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
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
        text="This graph shows streamflow (in cubic feet per second) for the past 90 days. 
        You can explore a different timeframe by clicking the button in the bottom-right 
        corner and adjusting the start and end dates. This data is sourced from the analysis
        and assimilation simulation of the National Water Model, which combines observed data 
        with model simulations to generate the most accurate estimates of current conditions. 
        To learn more about how this information is modeled or how to access and retrieve the data, 
        please visit: 
        https://www.sciencedirect.com/science/article/pii/S1364815224001841"
      />
    </div>
    <v-row v-if="isLoading" justify="center" align="center" class="mt-4">
      <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
      <span class="ml-3">Loading historical data...</span>
    </v-row>
    <LinePlot
      v-if="!isLoading"
      :timeseries="plot_timeseries"
      :quantiles="quantiles_data"
      :title="plot_title"
      :style="plot_style"
    />

    <v-card-actions class="position-relative" style="justify-content: flex-end; gap: 8px">
      <!-- Quantiles Toggle Button -->
      <v-tooltip location="bottom" max-width="200px" class="chart-tooltip">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            v-if="plot_timeseries.length > 0 && !isLoading"
            :color="showQuantiles ? 'primary' : 'default'"
            :disabled="loadingQuantiles"
            :loading="loadingQuantiles"
            @click="toggleQuantiles"
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

      <!-- Date Adjustment Button -->
      <v-menu
        v-model="timeSelectionMenu"
        location="top left"
        :offset="[-50, -60]"
        content-class="menu-content"
        attach="body"
        :close-on-content-click="false"
        :persistent="true"
        :retain-focus="false"
      >
        <template #activator="{ props: menuProps }">
          <v-tooltip text="Adjust Start and End Dates" location="right">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                v-if="plot_timeseries.length > 0 && !isLoading"
                v-bind="{ ...menuProps, ...tooltipProps }"
                icon
              >
                <v-icon color="primary">{{ mdiCalendarExpandHorizontal }}</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </template>

        <v-sheet style="margin-left: 16px; min-width: 300px">
          <v-list>
            <v-list-item>
              <v-menu v-model="startMenu" :close-on-content-click="false" offset-y min-width="auto">
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    v-model="formattedStartDate"
                    label="Start Date"
                    readonly
                    density="compact"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="tempStartDate"
                  :min="'2016-01-01'"
                  :max="
                    tempEndDate
                      ? new Date(new Date(tempEndDate).setDate(new Date(tempEndDate).getDate() - 1))
                          .toISOString()
                          .split('T')[0]
                      : '2099-12-31'
                  "
                  @update:modelValue="() => (startMenu = false)"
                ></v-date-picker>
              </v-menu>
            </v-list-item>

            <v-list-item>
              <v-menu v-model="endMenu" :close-on-content-click="false" offset-y min-width="auto">
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    v-model="formattedEndDate"
                    label="End Date"
                    readonly
                    density="compact"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="tempEndDate"
                  :min="
                    tempStartDate
                      ? new Date(
                          new Date(tempStartDate).setDate(new Date(tempStartDate).getDate() + 1)
                        )
                          .toISOString()
                          .split('T')[0]
                      : '2099-12-31'
                  "
                  @update:modelValue="() => (endMenu = false)"
                ></v-date-picker>
              </v-menu>
            </v-list-item>

            <v-list-item class="d-flex justify-end">
              <v-btn class="mt-2" color="primary" @click="onTimeSelectionClose">Apply</v-btn>
            </v-list-item>
          </v-list>
        </v-sheet>
      </v-menu>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import 'chartjs-adapter-date-fns'
import LinePlot from '@/components/LinePlot.vue'
import { ref, defineExpose, computed, onMounted, watch, toRef } from 'vue'
import { mdiCalendarExpandHorizontal, mdiChartAreaspline } from '@mdi/js'
import { API_BASE } from '@/constants'
import { mdiCodeJson, mdiFileDelimited } from '@mdi/js'
import InfoTooltip from '../components/InfoTooltip.vue'
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

// define properties that can be passed to this component
const props = defineProps({
  reachid: Number,
  reachname: String,
  show: {
    type: Boolean,
    required: true
  }
})
const reach_id = toRef(props, 'reachid') // make this property reactive to it triggers watch()
const reach_name = toRef(props, 'reachname') // make this property reactive to it triggers watch()

const plot_timeseries = ref([])
const quantiles_data = ref([])
const plot_title = ref()
const plot_style = ref()
const isLoading = ref(false)
const loadingQuantiles = ref(false)
const showQuantiles = ref(false)
const downloading = ref({ json: false, csv: false })
const error = ref(null)

// objects to hold the date values
// these are the raw date values used in the date picker
const startDate = ref(null)
const endDate = ref(null)
const tempStartDate = ref(null)
const tempEndDate = ref(null)

// bool that shows/hides the date picker menus
// true = visible, false = hidden
const startMenu = ref(false)
const endMenu = ref(false)
const timeSelectionMenu = ref(false)

// helper function to convert Date objects to ISO date strings
const toIsoDate = (date) => date.toISOString().split('T')[0]

// Function to initialize startDate and endDate.
// This is only called once when the component is mounted.
const initializeDates = () => {
  // Set the initial state for the time ranges
  // used in the historical plot.

  // start date is 90 days before the current date
  const today = new Date()
  const initialStart = new Date(today)
  initialStart.setDate(today.getDate() - 90)

  startDate.value = initialStart
  endDate.value = today
}

// Formatted display values
const formattedStartDate = computed({
  get() {
    return tempStartDate.value ? new Date(tempStartDate.value).toLocaleDateString() : ''
  },
  set(value) {
    tempStartDate.value = value ? toIsoDate(new Date(value)) : null
  }
})

const formattedEndDate = computed({
  get() {
    return tempEndDate.value ? new Date(tempEndDate.value).toLocaleDateString() : ''
  },
  set(value) {
    tempEndDate.value = value ? toIsoDate(new Date(value)) : null
  }
})

const clearPlot = () => {
  plot_timeseries.value = []
  quantiles_data.value = []
  plot_title.value = ''
  plot_style.value = {}
  showQuantiles.value = false
}

// Fetch quantiles data from the FastAPI endpoint
const getQuantilesData = async () => {
  if (!reach_id.value) return
  
  try {
    loadingQuantiles.value = true
    const response = await fetch(`${API_BASE}/timeseries/historical-quantiles?feature_id=${reach_id.value}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Get current year for date alignment
    const currentYear = new Date().getFullYear()
    
    // Transform the quantiles data for the chart - use actual dates for current year
    quantiles_data.value = [
      {
        hidden: true,
        data: data.map(item => {
          // Convert DOY to actual date in current year
          const date = new Date(currentYear, 0) // Start with Jan 1 of current year
          date.setDate(item.doy) // Set to the day-of-year
          return { x: date.toISOString().split('T')[0], y: item.q0 }
        }),
        borderColor: 'rgba(100, 100, 100, 0.3)',
        backgroundColor: 'rgba(100, 100, 100, 0.1)',
        borderDash: [5, 5],
        fill: false
      },
      {
        label: 'Much Below Normal',
        data: data.map(item => {
          const date = new Date(currentYear, 0)
          date.setDate(item.doy)
          return { x: date.toISOString().split('T')[0], y: item.q10 }
        }),
        borderColor: 'darkred',
        backgroundColor: 'red',
        fill: true
      },
      {
        label: 'Below Normal',
        data: data.map(item => {
          const date = new Date(currentYear, 0)
          date.setDate(item.doy)
          return { x: date.toISOString().split('T')[0], y: item.q25 }
        }),
        borderColor: 'darkyellow',
        backgroundColor: 'yellow',
        fill: '-1'
      },
      {
        label: 'Normal',
        data: data.map(item => {
          const date = new Date(currentYear, 0)
          date.setDate(item.doy)
          return { x: date.toISOString().split('T')[0], y: item.q75 }
        }),
        borderColor: 'darkgreen',
        backgroundColor: 'green',
        fill: '-1'
      },
      {
        label: 'Above Normal',
        data: data.map(item => {
          const date = new Date(currentYear, 0)
          date.setDate(item.doy)
          return { x: date.toISOString().split('T')[0], y: item.q90 }
        }),
        borderColor: 'darkblue',
        backgroundColor: 'blue',
        fill: '-1'
      }
    ]
    
  } catch (err) {
    console.error('Failed to load quantiles data:', err)
    error.value = `Failed to load quantiles data: ${err.message}`
  } finally {
    loadingQuantiles.value = false
  }
}

// Toggle quantiles display
const toggleQuantiles = async () => {
  if (showQuantiles.value) {
    // If currently showing, just hide them
    showQuantiles.value = false
    quantiles_data.value = []
  } else {
    // If not showing, fetch and show quantiles
    showQuantiles.value = true
    if (quantiles_data.value.length === 0) {
      await getQuantilesData()
    }
  }
}

// function to handle the closing of the date selection menu,
// this function is called when the user clicks the "Apply" button.
// This is necessary to ensure that nested v-menus close properly.
function onTimeSelectionClose() {
  // Close the date selection menu
  timeSelectionMenu.value = false

  // Trigger data fetch with updated dates,
  // which will trigger the watch function that
  // updates the lineplot.
  startDate.value = tempStartDate.value
  endDate.value = tempEndDate.value
}

// Collects historical plot data from the CIROH NWM API
const getHistoricalData = async () => {
  try {
    isLoading.value = true
    error.value = null

    const params = new URLSearchParams({
      reach_id: reach_id.value,
      start_date: toIsoDate(startDate.value),
      end_date: toIsoDate(endDate.value),
      offset: 3
    })

    const response = await fetch(`${API_BASE}/timeseries/nwm-historical?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    plot_timeseries.value = Object.entries(data).map(([x, y]) => ({ x, y }))
  } catch (err) {
    error.value = `Failed to load data: ${err.message}`
    console.error('API error:', err)
  } finally {
    isLoading.value = false
  }

  plot_title.value = 'Historical Streamflow - ' + reach_name.value
}

// Re-collects historical plot data whenever the
// startDate, endDate, or reachID change
watch([startDate, endDate, reach_id], async () => {
  if (startDate.value && endDate.value && reach_id.value) {
    await getHistoricalData()
    // Reset quantiles when reach ID changes
    if (showQuantiles.value) {
      quantiles_data.value = []
      await getQuantilesData()
    }
  }
})

// sync temp dates and actual dates when the menu opens
// this is to ensure that the date pickers show the
// actual dates in the lineplot when the menu is initially  opened
watch(timeSelectionMenu, (isOpen) => {
  if (isOpen) {
    tempStartDate.value = startDate.value
    tempEndDate.value = endDate.value
  }
})

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
  getHistoricalData,
  clearPlot
})

onMounted(() => {
  // Call the initialization function on setup
  initializeDates()
})
</script>

<style scoped>
.menu-content {
  z-index: 5000 !important;
}
.chart-tooltip {
  z-index: 99999 !important;
}

.chart-tooltip span {
  white-space: normal;
  word-break: normal;
}
</style>
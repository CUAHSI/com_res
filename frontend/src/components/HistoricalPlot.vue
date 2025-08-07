<template>
  <v-sheet v-if="isLoading" class="mx-auto" elevation="2" style="height: calc(25vh); width: 100%">
    <v-skeleton-loader
      v-if="isLoading"
      type="heading, image "
      :loading="isLoading"
      class="mx-auto"
    ></v-skeleton-loader>
    <v-row justify="center" align="center" class="mt-4">
      <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
      <span class="ml-3">Loading historical data...</span>
    </v-row>
  </v-sheet>

  <v-sheet v-else class="mx-auto" elevation="2" rounded style="height: calc(25vh); width: 100%">
    <v-row align="center" justify="end" class="mb-2">
      <v-menu location="right top" content-class="menu-content" attach="body">
        <template #activator="{ props: menuProps }">
          <v-tooltip text="Adjust Start and End Dates" location="right" style="z-index: 9999">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                v-bind="{ ...menuProps, ...tooltipProps }"
                icon
                style="position: absolute; right: 8px; top: 8px; z-index: 1000"
              >
                <v-icon color="green-darken-2">{{ mdiCalendarExpandHorizontal }}</v-icon>
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
                  v-model="startDate"
                  @update:modelValue="startMenu = false"
                  :min="'2016-01-01'"
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
                  v-model="endDate"
                  @update:modelValue="endMenu = false"
                  :min="'2016-01-01'"
                ></v-date-picker>
              </v-menu>
            </v-list-item>
          </v-list>
        </v-sheet>
      </v-menu>
    </v-row>
    <LinePlot
      :timeseries="plot_timeseries"
      :title="plot_title"
      :style="plot_style"
      style="box-shadow: none !important; margin: 0; padding: 0"
    />
  </v-sheet>
</template>

<script setup>
import 'chartjs-adapter-date-fns'
import LinePlot from '@/components/LinePlot.vue'
import { ref, defineExpose, computed, onMounted, watch, toRef } from 'vue'
import { mdiCalendarExpandHorizontal } from '@mdi/js'
import { API_BASE } from '@/constants'
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
  reachname: String
})
const reach_id = toRef(props, 'reachid') // make this property reactive to it triggers watch()
const reach_name = toRef(props, 'reachname') // make this property reactive to it triggers watch()

const plot_timeseries = ref([])
const plot_title = ref()
const plot_style = ref()
const isLoading = ref(false)
const error = ref(null)

// objects to hold the date values
// these are the raw date values used in the date picker
const startDate = ref(null)
const endDate = ref(null)

// bool that shows/hides the date picker menus
// true = visible, false = hidden
const startMenu = ref(false)
const endMenu = ref(false)

// helper function to convert Date objects to ISO date strings
const toIsoDate = (date) => date.toISOString().split('T')[0]

// Function to initialize startDate and endDate
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
    return startDate.value ? new Date(startDate.value).toLocaleDateString() : ''
  },
  set(value) {
    startDate.value = value ? toIsoDate(new Date(value)) : null
  }
})

const formattedEndDate = computed({
  get() {
    return endDate.value ? new Date(endDate.value).toLocaleDateString() : ''
  },
  set(value) {
    endDate.value = value ? toIsoDate(new Date(value)) : null
  }
})

const clearPlot = () => {
  plot_timeseries.value = []
  plot_title.value = ''
  plot_style.value = {}
}

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

// Recompute when startDate or endDate changes
watch([startDate, endDate, reach_id], async () => {
  if (startDate.value && endDate.value && reach_id.value) {
    await getHistoricalData()
  }
})

defineExpose({
  getHistoricalData,
  clearPlot
})

onMounted(() => {
  // Call the initialization function on setup
  initializeDates()
})
</script>

<style>
.menu-content {
  z-index: 5000 !important;
}
</style>

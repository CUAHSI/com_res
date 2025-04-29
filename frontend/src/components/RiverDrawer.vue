<template>
  <v-sheet class="mx-auto" elevation="8" style="height: calc(100vh - 165px); overflow-y: scroll">
    <h2 class="ma-2 text-center">Name of Selected River</h2>
    <v-tabs v-model="tab">
      <v-tab value="tab-metadata"> Metadata </v-tab>
      <v-tab value="tab-historical"> Historical </v-tab>
      <v-tab value="tab-forecast"> Forecast </v-tab>
    </v-tabs>

    <!-- content that will be rendered in the "historical" tab -->
    <v-sheet v-if="tab === 'tab-historical'" class="pa-4" style="padding: 5px !important">
      <LinePlot :timeseries="plot_timeseries" :title="plot_title" />

      <v-btn
        class="mb-4"
        color="primary"
        @click="getHistoricalData"
        style="margin-top: 10px; width: 100px"
        :loading="isLoading"
        :disabled="isLoading"
      >
        Plot Data
      </v-btn>
    </v-sheet>
  </v-sheet>
</template>

<script setup>
import LinePlot from '@/components/LinePlot.vue'
import { ref } from 'vue'
import { API_BASE } from '@/constants'

const tab = ref('tab-metadata')

const plot_timeseries = ref([])
const plot_title = ref()
const isLoading = ref(false)
const error = ref(null)

const getHistoricalData = async () => {
  console.log('Fetching historical data...')
  try {
    isLoading.value = true
    error.value = null

    // TODO:: get these values from other components on the page.
    // These are placeholders for now and will be replaced with actual values
    // when we implement the logic to get the selected river and date range.
    const params = new URLSearchParams({
      reach_id: '5984765',
      start_date: '2024-10-01',
      end_date: '2024-12-31',
      offset: 3
    })
    const response = await fetch(`${API_BASE}/timeseries/nwm-historical?${params.toString()}`)

    console.log('API response:', response)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('response JSON:', data)
    console.log(
      'mapped;',
      Object.entries(data).map(([x, y]) => ({ x, y }))
    )
    plot_timeseries.value = Object.entries(data).map(([x, y]) => ({ x, y }))
  } catch (err) {
    error.value = `Failed to load data: ${err.message}`
    console.error('API error:', err)
  } finally {
    isLoading.value = false
  }

  // TODO: This will be replaced with the actual title of the plot obtained
  // from the map interface.
  // set plot title
  plot_title.value = 'Historical Data for River X'
}
</script>

<style scoped></style>

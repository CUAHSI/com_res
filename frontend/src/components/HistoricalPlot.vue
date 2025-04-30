<template>
  <LinePlot :timeseries="plot_timeseries" :title="plot_title" :style="plot_style" />
</template>

<script setup>
import 'chartjs-adapter-date-fns'
import LinePlot from '@/components/LinePlot.vue'
import { ref, defineExpose } from 'vue'
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

const plot_timeseries = ref([])
const plot_title = ref()
const plot_style = ref()
const isLoading = ref(false)
const error = ref(null)

const clearPlot = () => {
  plot_timeseries.value = []
  plot_title.value = ''
  plot_style.value = {}
}

const getHistoricalData = async (reach_id, name, start_date, end_date) => {
  try {
    isLoading.value = true
    error.value = null

    const params = new URLSearchParams({
      reach_id: reach_id,
      start_date: start_date.toISOString().split('T')[0],
      end_date: end_date.toISOString().split('T')[0],
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

  plot_title.value = 'Historical Streamflow - ' + name
}

defineExpose({
  getHistoricalData,
  clearPlot
})
</script>

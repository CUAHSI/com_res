<template>
  <v-sheet class="mx-auto" elevation="8">
    <h5>{{ props.title }}</h5>
    <div style="height: calc(25vh); width: 100%">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </v-sheet>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import 'chartjs-adapter-date-fns'
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

// Define the chart data to be rendered in the component
const props = defineProps({
  timeseries: {
    type: Array,
    required: true
  },
  title: {
    type: String,
    default: ''
  }
})
const chartData = computed(() => ({
  datasets: [
    {
      label: 'Streamflow (cfs)',
      data: props.timeseries,
      fill: true,
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      tension: 0.4, // makes the line smooth
      pointRadius: 0, // turn off points
      pointHoverRadius: 6
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      type: 'time',
      time: {
        unit: 'day'
      },
      ticks: {
        color: '#555'
      },
      grid: {
        color: '#eee'
      }
    },
    y: {
      title: {
        display: true,
        text: 'Streamflow (cfs)'
      },
      ticks: {
        color: '#555'
      },
      grid: {
        color: '#eee'
      }
    }
  },
  plugins: {
    legend: {
      display: false,
      labels: {
        color: '#333'
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false
    }
  }
}
</script>

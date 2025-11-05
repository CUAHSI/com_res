<template>
  <h5>{{ props.title }}</h5>
  <div style="height: calc(23vh); width: 100%">
    <Line :data="chartData" :options="chartOptions" />
  </div>
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
  quantiles: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: ''
  }
})

const chartData = computed(() => {
  const datasets = [
    {
      label: 'Streamflow (cms)',
      data: props.timeseries,
      fill: true,
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      tension: 0.4, // makes the line smooth
      pointRadius: 0, // turn off points
      pointHoverRadius: 6,
      order: 2 // Ensure main streamflow line is on top
    }
  ]

  // Add quantiles datasets if provided
  if (props.quantiles && props.quantiles.length > 0) {
    // Add quantiles datasets at the beginning so they appear behind the main line
    datasets.unshift(...props.quantiles.map(quantileDataset => ({
      ...quantileDataset,
      tension: 0.1, // Less smooth for quantile lines
      pointRadius: 0, // turn off points
      pointHoverRadius: 3,
      borderWidth: 1,
      order: 1 // Ensure quantiles are behind the main line
    })))
  }

  return { datasets }
})

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
        text: 'Streamflow (cms)'
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
      display: true, // Enable legend to show quantile labels
      labels: {
        color: '#333',
        usePointStyle: true,
        boxWidth: 10,
        font: {
          size: 11
        }
      },
      position: 'top'
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || ''
          if (label) {
            label += ': '
          }
          if (context.parsed.y !== null) {
            label += context.parsed.y.toFixed(2) + ' cms'
          }
          return label
        }
      }
    }
  },
  interaction: {
    mode: 'index',
    intersect: false
  }
}
</script>
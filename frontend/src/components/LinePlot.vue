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
  Filler,
  LogarithmicScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, TimeScale, Filler, LogarithmicScale)

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

const hasQuantiles = computed(() => props.quantiles && props.quantiles.length > 0)

const chartData = computed(() => {
  const datasets = [
    {
      label: 'Streamflow (cms)',
      data: props.timeseries,
      fill: !hasQuantiles.value, // Only fill when quantiles are NOT shown
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      tension: 0.4, // makes the line smooth
      pointRadius: 0, // turn off points
      pointHoverRadius: 6,
      order: 2 // Ensure main streamflow line is on top
    }
  ]

  // Add quantiles datasets if provided
  if (hasQuantiles.value) {
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

const chartOptions = computed(() => ({
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
      type: hasQuantiles.value ? 'logarithmic' : 'linear',
      title: {
        display: true,
        text: 'Streamflow (cms)'
      },
      ticks: {
        color: '#555',
        callback: function(value) {
          // Format tick labels for logarithmic scale
          if (hasQuantiles.value) {
            // For very small values, show 0 instead of scientific notation
            if (value < 0.1) return '0'
            return Number(value.toString()) // Convert to number and back to string to avoid scientific notation
          }
          return value
        }
      },
      grid: {
        color: '#eee'
      },
      // Configure logarithmic scale to start as close to 0 as possible
      ...(hasQuantiles.value && {
        min: 0.001, // Set a very small minimum to approximate starting at 0
        afterBuildTicks: function(axis) {
          // Customize ticks for better readability on log scale
          const ticks = []
          const minPower = Math.floor(Math.log10(axis.min))
          const maxPower = Math.ceil(Math.log10(axis.max))
          
          // Include 0 as the first tick
          ticks.push(0)
          
          // Add logarithmic ticks
          for (let i = minPower; i <= maxPower; i++) {
            const tickValue = Math.pow(10, i)
            if (tickValue >= axis.min && tickValue <= axis.max) {
              ticks.push(tickValue)
            }
          }
          return ticks
        }
      }),
      // For linear scale, ensure it starts at 0
      ...(!hasQuantiles.value && {
        beginAtZero: true
      })
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
}))
</script>
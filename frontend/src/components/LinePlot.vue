<template>
  <h5>{{ props.title }}</h5>
  <Line :data="chartData" :options="chartOptions" ref="chartRef"/>
</template>

<script setup>
import { computed, ref } from 'vue'
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

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Filler,
  LogarithmicScale
)

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
  iqr: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: ''
  },
  useLogScale: {
    type: Boolean,
    default: false
  },
  showLegend: {
    type: Boolean,
    default: true
  }
})

const chartRef = ref(null)

defineExpose({
  // Method to force chart update
  updateChart: () => {
    if (chartRef.value && chartRef.value.chart) {
      chartRef.value.chart.update()
    }
  },
  // Method to resize chart
  resizeChart: () => {
    if (chartRef.value && chartRef.value.chart) {
      chartRef.value.chart.resize()
    }
  },
  // Method to update and resize
  refreshChart: () => {
    if (chartRef.value && chartRef.value.chart) {
      chartRef.value.chart.resize()
      chartRef.value.chart.update()
    }
  },
  // Direct access to chart instance (use with caution)
  getChart: () => {
    return chartRef.value?.chart || null
  }
})

const hasQuantiles = computed(() => props.quantiles && props.quantiles.length > 0)
const hasIQR = computed(() => props.iqr && props.iqr.length > 0)

// Only use log scale when explicitly requested AND quantiles are present (not for IQR)
const shouldUseLogScale = computed(() => props.useLogScale && hasQuantiles.value && !hasIQR.value)

// Calculate x-axis min and max from the appropriate data source
const xAxisRange = computed(() => {
  // When IQR is shown, use IQR data for x-axis range
  if (hasIQR.value && props.iqr[0] && props.iqr[0].data) {
    const dates = props.iqr[0].data.map((item) => new Date(item.x).getTime())
    return {
      min: new Date(Math.min(...dates)),
      max: new Date(Math.max(...dates))
    }
  }

  // Otherwise use streamflow data
  if (!props.timeseries || props.timeseries.length === 0) {
    return { min: null, max: null }
  }

  const dates = props.timeseries.map((item) => new Date(item.x).getTime())
  return {
    min: new Date(Math.min(...dates)),
    max: new Date(Math.max(...dates))
  }
})

const chartData = computed(() => {
  const datasets = []

  // Only show original streamflow when IQR is NOT shown
  if (!hasIQR.value) {
    datasets.push({
      label: 'Streamflow (cfs)',
      data: props.timeseries,
      fill: !hasQuantiles.value, // Only fill when quantiles are NOT shown
      backgroundColor: 'rgba(0, 0, 0, 0.2)', // black with transparency
      borderColor: 'rgba(0, 0, 0, 1)', // solid black
      tension: 0.4, // makes the line smooth
      pointRadius: 0, // turn off points
      pointHoverRadius: 6,
      order: 3 // Ensure main streamflow line is on top of everything
    })
  }

  // Add IQR datasets if provided
  if (hasIQR.value) {
    datasets.push(...props.iqr)
  }

  // Add quantiles datasets if provided (at the very bottom)
  if (hasQuantiles.value) {
    datasets.unshift(
      ...props.quantiles.map((quantileDataset) => ({
        ...quantileDataset,
        tension: 0.1, // Less smooth for quantile lines
        pointRadius: 0, // turn off points
        pointHoverRadius: 3,
        borderWidth: 1,
        order: 0 // Ensure quantiles are at the very bottom
      }))
    )
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
      },
      // Force x-axis to use the appropriate data range
      min: xAxisRange.value.min,
      max: xAxisRange.value.max
    },
    y: {
      type: shouldUseLogScale.value ? 'logarithmic' : 'linear', // Only use log scale for quantiles, not IQR
      title: {
        display: true,
        text: 'Streamflow (cfs)'
      },
      ticks: {
        color: '#555',
        callback: function (value) {
          // Format tick labels for logarithmic scale
          if (shouldUseLogScale.value) {
            return Number(value.toString()) // Convert to number and back to string to avoid scientific notation
          }
          // Format linear scale labels to show max 2 decimal places
          if (typeof value === 'number') {
            // If the value is a whole number, show no decimals
            if (value % 1 === 0) {
              return value.toString()
            }
            // Otherwise, show up to 2 decimal places
            return value.toFixed(2)
          }
          return value
        }
      },
      grid: {
        color: '#eee'
      },
      // Configure logarithmic scale behavior - only when explicitly requested for quantiles
      ...(shouldUseLogScale.value && {
        afterBuildTicks: function (axis) {
          // Customize ticks for better readability on log scale
          const ticks = []
          const min = Math.pow(10, Math.floor(Math.log10(axis.min)))
          const max = Math.pow(10, Math.ceil(Math.log10(axis.max)))

          for (let i = Math.floor(Math.log10(min)); i <= Math.ceil(Math.log10(max)); i++) {
            ticks.push(Math.pow(10, i))
          }
          return ticks
        }
      })
    }
  },
  plugins: {
    legend: {
      display: props.showLegend && (hasQuantiles.value || hasIQR.value), // Control visibility via prop and only show when quantiles or IQR are present
      labels: {
        color: '#333',
        usePointStyle: true,
        boxWidth: 8,
        boxHeight: 8,
        padding: 10,
        font: {
          size: 10,
          weight: 'normal'
        },
        // Filter out hidden datasets from legend
        filter: function (item) {
          return !item.text || item.text.length > 0 // Only show items with labels
        }
      },
      position: 'bottom',
      maxHeight: 60, // Limit the maximum height of the legend
      // Make legend more compact
      rtl: false,
      // Reduce spacing between legend items
      itemMargin: {
        horizontal: 8,
        vertical: 2
      }
    },
    tooltip: {
      mode: 'nearest',
      intersect: false,

      filter: function (tooltipItem) {
        // Skip datasets without labels (like Q0 or empty IQR bounds)
        return tooltipItem.dataset.label && tooltipItem.dataset.label.length > 0
      },
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || ''
          if (label) {
            label += ': '
          }
          if (context.parsed.y !== null) {
            label += context.parsed.y.toFixed(2) + ' cfs'
          }
          return label
        },
        // Custom title to show the date
        title: function (items) {
          if (items.length > 0 && items[0].parsed.x) {
            const date = new Date(items[0].parsed.x)
            return date.toLocaleDateString()
          }
          return ''
        }
      }
    }
  }
}))
</script>

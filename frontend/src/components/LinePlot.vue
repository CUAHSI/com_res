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

// Calculate x-axis min and max from the streamflow data only
const xAxisRange = computed(() => {
  if (!props.timeseries || props.timeseries.length === 0) {
    return { min: null, max: null }
  }
  
  const dates = props.timeseries.map(item => new Date(item.x).getTime())
  return {
    min: new Date(Math.min(...dates)),
    max: new Date(Math.max(...dates))
  }
})

// Function to interpolate quantiles data to match streamflow x-values
const interpolatedQuantiles = computed(() => {
  if (!hasQuantiles.value || props.timeseries.length === 0) {
    return props.quantiles
  }

  return props.quantiles.map(quantileDataset => {
    // Skip interpolation for hidden datasets if needed
    if (quantileDataset.hidden) {
      return quantileDataset
    }

    const originalData = quantileDataset.data
    if (originalData.length === 0) {
      return quantileDataset
    }

    // Create a map of original quantile data by date for quick lookup
    const quantileMap = new Map()
    originalData.forEach(item => {
      const dateKey = new Date(item.x).toISOString().split('T')[0]
      quantileMap.set(dateKey, item.y)
    })

    // Interpolate quantile values for each streamflow date
    const interpolatedData = props.timeseries.map(streamflowPoint => {
      const streamflowDate = new Date(streamflowPoint.x)
      const dateKey = streamflowDate.toISOString().split('T')[0]
      
      // Try exact match first
      if (quantileMap.has(dateKey)) {
        return {
          x: streamflowPoint.x,
          y: quantileMap.get(dateKey)
        }
      }

      // If no exact match, find the closest quantile data points for interpolation
      const streamflowTime = streamflowDate.getTime()
      const quantileTimes = originalData.map(item => new Date(item.x).getTime())
      
      // Find the closest previous and next quantile points
      let prevIndex = -1
      let nextIndex = -1
      
      for (let i = 0; i < quantileTimes.length; i++) {
        if (quantileTimes[i] <= streamflowTime) {
          prevIndex = i
        } else {
          nextIndex = i
          break
        }
      }

      // Handle edge cases
      if (prevIndex === -1) {
        // Before first quantile point - use first point
        return {
          x: streamflowPoint.x,
          y: originalData[0].y
        }
      }
      
      if (nextIndex === -1) {
        // After last quantile point - use last point
        return {
          x: streamflowPoint.x,
          y: originalData[originalData.length - 1].y
        }
      }

      // Linear interpolation between closest points
      const prevPoint = originalData[prevIndex]
      const nextPoint = originalData[nextIndex]
      const prevTime = quantileTimes[prevIndex]
      const nextTime = quantileTimes[nextIndex]
      
      const ratio = (streamflowTime - prevTime) / (nextTime - prevTime)
      const interpolatedY = prevPoint.y + (nextPoint.y - prevPoint.y) * ratio
      
      return {
        x: streamflowPoint.x,
        y: interpolatedY
      }
    })

    return {
      ...quantileDataset,
      data: interpolatedData
    }
  })
})

const chartData = computed(() => {
  const datasets = [
    {
      label: 'Streamflow (cms)',
      data: props.timeseries,
      fill: !hasQuantiles.value, // Only fill when quantiles are NOT shown
      backgroundColor: 'rgba(0, 0, 0, 0.2)', // black with transparency
      borderColor: 'rgba(0, 0, 0, 1)', // solid black
      tension: 0.4, // makes the line smooth
      pointRadius: 0, // turn off points
      pointHoverRadius: 6,
      order: 2 // Ensure main streamflow line is on top
    }
  ]

  // Add quantiles datasets if provided
  if (hasQuantiles.value) {
    // Use interpolated quantiles data
    datasets.unshift(...interpolatedQuantiles.value.map(quantileDataset => ({
      ...quantileDataset,
      tension: 0.1, // Less smooth for quantile lines
      pointRadius: 0, // turn off points
      pointHoverRadius: 0, // No hover points for quantiles
      borderWidth: 1,
      order: 1, // Ensure quantiles are behind the main line
      // Ensure Q0 dataset doesn't show in tooltip
      ...(quantileDataset.hidden && {
        tooltip: {
          enabled: false
        }
      })
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
      },
      // Force x-axis to use streamflow data range only
      min: xAxisRange.value.min,
      max: xAxisRange.value.max
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
            return Number(value.toString()) // Convert to number and back to string to avoid scientific notation
          }
          return value
        }
      },
      grid: {
        color: '#eee'
      },
      // Configure logarithmic scale behavior
      ...(hasQuantiles.value && {
        min: 0.01, // Set a reasonable minimum for log scale
        afterBuildTicks: function(axis) {
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
      display: true, // Enable legend to show quantile labels
      labels: {
        color: '#333',
        usePointStyle: true,
        boxWidth: 10,
        font: {
          size: 11
        },
        // Filter out hidden datasets from legend
        filter: function(item) {
          return !item.text || item.text.length > 0 // Only show items with labels
        }
      },
      position: 'top'
    },
    tooltip: {
      mode: 'x',
      intersect: false,
      position: 'nearest',
      // Filter out datasets that shouldn't be shown in tooltip
      filter: function(tooltipItem) {
        // Skip datasets without labels (like Q0)
        return tooltipItem.dataset.label && tooltipItem.dataset.label.length > 0
      },
      // Always show all datasets at the hovered x position
      itemSort: function(a, b) {
        // Sort to show quantiles in logical order
        const order = {
          'Much Below Normal': 1,
          'Below Normal': 2,
          'Normal': 3,
          'Above Normal': 4,
          'Streamflow (cms)': 5
        }
        return (order[a.dataset.label] || 6) - (order[b.dataset.label] || 6)
      },
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
        },
        // Custom title to show the date
        title: function(items) {
          if (items.length > 0 && items[0].parsed.x) {
            const date = new Date(items[0].parsed.x)
            return date.toLocaleDateString()
          }
          return ''
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
<template>
  <v-card class="slider-wrapper">
    <!-- Header with title and info tooltip -->
    <div class="slider-header">
      <h3>{{ headerTitle }}</h3>
      <InfoTooltip
        iconSize="x-small"
        :text="tooltipText"
      />
    </div>

    <div class="thermometer-slider-container" :style="containerStyle">
      <div class="thermometer">
        <!-- Mercury fill -->
        <div class="mercury" :style="mercuryStyle"></div>

        <!-- Grabbable handle -->
        <div class="handle" :style="handleStyle" @mousedown="startDrag" @touchstart="startDrag">
          <div class="handle-label">{{ handleLabel }}</div>
        </div>

        <!-- Vuetify slider (hidden but handles keyboard accessibility) -->
        <v-slider
          v-model="modelValue"
          vertical
          :max="max"
          :min="min"
          :step="step"
          hide-details
          class="slider-input"
          @update:modelValue="$emit('update:modelValue', modelValue)"
        ></v-slider>

        <!-- Tick marks -->
        <div class="ticks">
          <div
            v-for="(_, index) in ticks"
            :key="index"
            class="tick"
            :class="{ 'major-tick': index % majorTickInterval === 0 }"
            :style="{ bottom: `${(index / (ticks.length - 1)) * 100}%` }"
          ></div>
        </div>

        <!-- Labels inside thermometer -->
        <div class="labels-inside">
          <div
            v-for="(stage, index) in visibleStages"
            :key="index"
            class="label-inside"
            :style="{ bottom: `${((stage - min) / (max - min)) * 100}%` }"
          >
            {{ stage }}
          </div>
        </div>
      </div>
    </div>

    <!-- Footer with additional info -->
    <div class="slider-footer">
      <span>{{ footerLabel }}</span>
      <InfoTooltip
        :text="footerTooltip"
      />
    </div>
  </v-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import { debounce } from 'lodash'
import InfoTooltip from './InfoTooltip.vue'
import { useFeaturesStore } from '@/stores/features'
import { storeToRefs } from 'pinia'

const featureStore = useFeaturesStore()
const { multiReachMode } = storeToRefs(featureStore)

const props = defineProps({
  modelValue: {
    type: Number,
    required: true
  },
  min: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 100
  },
  step: {
    type: Number,
    default: 1
  },
  width: {
    type: String,
    default: '50px'
  },
  height: {
    type: String,
    default: '400px'
  },
  stages: {
    type: Array,
    default: () => [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
  },
  flows: {
    type: Array,
    default: () => [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
  },
  majorTickInterval: {
    type: Number,
    default: 4
  },
  tickCount: {
    type: Number,
    default: 20
  },
  minLabelSpacing: {
    type: Number,
    default: 40 // Minimum vertical pixels between labels to prevent overlap
  }
})

const emit = defineEmits(['update:modelValue'])

const trackSliderChange = debounce((value) => {
  try {
    if (window.heap) {
      window.heap.track('Slider Value Changed', {
        newValue: value,
        min: props.min,
        max: props.max,
        step: props.step
      })
    } else {
      console.warn('Heap is not available. Slider change event not tracked.')
    }
  } catch (error) {
    console.warn('Error tracking slider change event:', error)
  }
}, 300)

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
    trackSliderChange(value)
  }
})

const ticks = Array(props.tickCount).fill(0)
const isDragging = ref(false)
const startY = ref(0)
const startValue = ref(0)

// Computed properties for dynamic text based on multiReachMode
const headerTitle = computed(() => 
  multiReachMode.value ? 'Stage' : 'Stage-Flow'
)

const tooltipText = computed(() =>
  multiReachMode.value 
    ? 'This slider controls water stage levels. Drag the handle to adjust stage values. The color gradient indicates intensity levels.'
    : 'This slider controls water stage levels and their corresponding flow rates (cms). Drag the handle to adjust values. The color gradient indicates intensity levels.'
)

const handleLabel = computed(() =>
  multiReachMode.value 
    ? `${props.modelValue} m`
    : `${flowFromStage(props.modelValue)} cms`
)

const footerLabel = computed(() =>
  multiReachMode.value ? 'Stage (m)' : 'Stage (m)'
)

const footerTooltip = computed(() =>
  multiReachMode.value
    ? 'Stage values represent water height measurements. Adjust the slider to change the water stage level.'
    : 'Stage values represent water height measurements. Each stage corresponds to a specific flow rate in cubic feet per second (cms).'
)

// Calculate which stages to show based on available space
const visibleStages = computed(() => {
  const containerHeight = parseInt(props.height) || 400
  const maxPossibleLabels = Math.floor(containerHeight / props.minLabelSpacing)

  if (props.stages.length <= maxPossibleLabels) {
    return props.stages
  }

  // If too many labels, show a subset with every Nth label
  const step = Math.ceil(props.stages.length / maxPossibleLabels)
  return props.stages.filter(
    (_, index) => index % step === 0 || index === 0 || index === props.stages.length - 1
  )
})

const containerStyle = computed(() => ({
  width: props.width,
  height: props.height
}))

const mercuryStyle = computed(() => ({
  height: `${((props.modelValue - props.min) / (props.max - props.min)) * 100}%`,
  backgroundColor: 'blue',
  margin: '0 10px' // Add horizontal padding
}))

const handleStyle = computed(() => ({
  bottom: `${((props.modelValue - props.min) / (props.max - props.min)) * 100}%`,
  cursor: isDragging.value ? 'grabbing' : 'grab'
}))

const flowFromStage = (stage) => {
  const index = props.stages.indexOf(stage)
  return index >= 0 ? props.flows[index] : null
}

const startDrag = (e) => {
  isDragging.value = true
  startY.value = e.clientY || e.touches[0].clientY
  startValue.value = props.modelValue

  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('touchmove', handleDrag, { passive: false })
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchend', stopDrag)
}

const handleDrag = (e) => {
  if (!isDragging.value) return
  e.preventDefault()

  const clientY = e.clientY || e.touches[0].clientY
  const container = document.querySelector('.thermometer')
  const rect = container.getBoundingClientRect()

  let position = 1 - (clientY - rect.top) / rect.height
  position = Math.max(0, Math.min(1, position))
  const range = props.max - props.min
  const newValue = props.min + position * range
  modelValue.value = props.step > 1 ? Math.round(newValue / props.step) * props.step : newValue
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchend', stopDrag)
}
</script>

<style scoped>
.slider-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 12px 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.thermometer-slider-container {
  display: flex;
  justify-content: center;
  pointer-events: none;
  box-sizing: border-box;
  width: 100%;
  margin: 5px 0;
}

/* Header styles */
.slider-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  width: 100%;
  position: relative;
  z-index: 1001;
  pointer-events: auto;
  flex-wrap: wrap;
  gap: 4px;
}

.slider-header h3 {
  margin: 0;
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  text-align: center;
  font-weight: bold;
  line-height: 1.2;
}

/* Footer styles */
.slider-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  width: 100%;
  font-size: 12px;
  color: #666;
  position: relative;
  z-index: 1001;
  pointer-events: auto;
  gap: 4px;
}

/* Ensure tooltips have high z-index */
.slider-header >>> .v-overlay__content,
.slider-footer >>> .v-overlay__content {
  z-index: 1002 !important;
  max-width: 200px;
  white-space: normal;
}

.thermometer {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  border-radius: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  border: 2px solid #ddd;
  overflow: visible;
  pointer-events: auto;
  padding-right: 30px;
  /* Make room for labels */
}

.mercury {
  position: absolute;
  bottom: 0;
  width: calc(100% - 20px);
  /* Account for horizontal padding */
  transition: height 0.2s ease;
  border-radius: 0 0 18px 18px;
  margin: 0 10px;
}

.handle {
  position: absolute;
  left: 50%;
  transform: translate(-50%, 50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: white;
  border: 2px solid #1976d2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 2;
  cursor: grab;
  user-select: none;
}

.handle:active {
  cursor: grabbing;
}

.handle-label {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 12px;
  font-weight: bold;
  color: #1976d2;
  background-color: white;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.slider-input {
  position: absolute;
  height: 100%;
  width: 100%;
  opacity: 0;
}

.ticks {
  position: absolute;
  right: 25px;
  top: 10px;
  bottom: 10px;
  width: 2px;
  background-color: #333;
}

.tick {
  position: absolute;
  right: 0;
  width: 6px;
  height: 1px;
  background-color: #333;
  transform: translateX(100%);
}

.major-tick {
  width: 10px;
  height: 2px;
}

.labels-inside {
  position: absolute;
  right: 8px;
  top: 10px;
  bottom: 10px;
  width: 30px;
  pointer-events: none;
}

.label-inside {
  position: absolute;
  transform: translateY(50%);
  font-size: 10px;
  color: #333;
  text-align: right;
  padding-right: 8px;
  z-index: 1;
  text-shadow:
    -1px -1px 0 white,
    1px -1px 0 white,
    -1px 1px 0 white,
    1px 1px 0 white;
}

/* Make sure mercury doesn't obscure labels */
.mercury {
  z-index: 0;
}

/* Adjust handle z-index to stay above everything */
.handle {
  z-index: 2;
}
</style>
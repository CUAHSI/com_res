<template>
  <div class="thermometer-slider-container" :style="containerStyle">
    <!-- Header with title and info tooltip -->
    <div class="slider-header">
      <h3>Stage-Flow Controller</h3>
      <InfoTooltip
        text="This slider controls water stage levels and their corresponding flow rates (cfs). Drag the handle to adjust values, or use keyboard arrows for precise control. The color gradient indicates intensity levels."
        popupLocation="left"
      />
    </div>

    <div class="thermometer">
      <!-- Mercury fill -->
      <div class="mercury" :style="mercuryStyle"></div>

      <!-- Grabbable handle -->
      <div class="handle" :style="handleStyle" @mousedown="startDrag" @touchstart="startDrag">
        <div class="handle-label">{{ flowFromStage(modelValue) }} cfs</div>
      </div>

      <!-- Vuetify slider (hidden but handles keyboard accessibility) -->
      <v-slider v-model="modelValue" vertical :max="max" :min="min" :step="step" hide-details class="slider-input"
        @update:modelValue="$emit('update:modelValue', modelValue)"></v-slider>

      <!-- Tick marks -->
      <div class="ticks">
        <div v-for="(_, index) in ticks" :key="index" class="tick"
          :class="{ 'major-tick': index % majorTickInterval === 0 }"
          :style="{ bottom: `${(index / (ticks.length - 1)) * 100}%` }"></div>
      </div>

      <!-- Labels inside thermometer -->
      <div class="labels-inside">
        <div v-for="(stage, index) in visibleStages" :key="index" class="label-inside"
          :style="{ bottom: `${((stage - min) / (max - min)) * 100}%` }">
          {{ stage }}
        </div>
      </div>
    </div>

    <!-- Footer with additional info -->
    <div class="slider-footer">
      <span>Stage (ft)</span>
      <InfoTooltip
        text="Stage values represent water height measurements. Each stage corresponds to a specific flow rate in cubic feet per second (cfs)." />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import InfoTooltip from './InfoTooltip.vue' // Make sure to import the InfoTooltip

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

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const ticks = Array(props.tickCount).fill(0)
const isDragging = ref(false)
const startY = ref(0)
const startValue = ref(0)

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
  height: props.height,
  right: '20px',
  top: '50%',
  transform: 'translateY(-50%)',
  padding: '20px 0', // Add vertical padding
}))

const mercuryStyle = computed(() => ({
  height: `${((props.modelValue - props.min) / (props.max - props.min)) * 100}%`,
  backgroundColor: mercuryColor.value,
  margin: '0 10px' // Add horizontal padding
}))

const handleStyle = computed(() => ({
  bottom: `${((props.modelValue - props.min) / (props.max - props.min)) * 100}%`,
  cursor: isDragging.value ? 'grabbing' : 'grab'
}))

const mercuryColor = computed(() => {
  const percent = (props.modelValue - props.min) / (props.max - props.min)
  if (percent < 0.5) {
    const subPercent = percent * 2
    const hue = 200 + (280 - 200) * subPercent
    return `hsl(${hue}, 80%, ${70 - subPercent * 20}%)`
  } else {
    const subPercent = (percent - 0.5) * 2
    const hue = 280 + (360 - 280) * subPercent
    return `hsl(${hue > 360 ? hue - 360 : hue}, 80%, ${50 - subPercent * 10}%)`
  }
})

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
  const container = document.querySelector('.thermometer-slider-container')
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
.thermometer-slider-container {
  position: absolute;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  box-sizing: border-box;
}

.thermometer {
  position: relative;
  width: 100%;
  height: calc(100% - 40px);
  /* Account for padding */
  background-color: #f5f5f5;
  border-radius: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  border: 2px solid #ddd;
  overflow: visible;
  pointer-events: auto;
  margin: 20px 0;
  /* Add vertical padding */
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

.slider-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  width: 100%;
}

.slider-header h3 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.slider-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  width: 100%;
  font-size: 12px;
  color: #666;
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

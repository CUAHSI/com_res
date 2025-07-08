<template>
  <div class="thermometer-slider-container" :style="containerStyle">
    <div class="thermometer">
      <!-- Mercury fill -->
      <div class="mercury" :style="mercuryStyle"></div>

      <!-- Grabbable handle -->
      <div class="handle" :style="handleStyle" @mousedown="startDrag" @touchstart="startDrag">
        <div class="handle-label">Water Stage</div>
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
          v-for="(label, index) in labels"
          :key="index"
          class="label-inside"
          :style="{ bottom: `${((label.value - min) / (max - min)) * 100}%` }"
        >
          {{ label.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

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
    default: '400px' // Increased height to accommodate all labels
  },
  labels: {
    type: Array,
    default: () => [
      { value: 0, text: '0' },
      { value: 20, text: '20' },
      { value: 40, text: '40' },
      { value: 60, text: '60' },
      { value: 80, text: '80' },
      { value: 100, text: '100' }
    ]
  },
  majorTickInterval: {
    type: Number,
    default: 4 // Adjusted to match label frequency
  },
  tickCount: {
    type: Number,
    default: 20
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

const containerStyle = computed(() => ({
  width: props.width,
  height: props.height,
  right: '20px',
  top: '50%',
  transform: 'translateY(-50%)'
}))

const mercuryStyle = computed(() => ({
  height: `${((props.modelValue - props.min) / (props.max - props.min)) * 100}%`,
  backgroundColor: mercuryColor.value
}))

const handleStyle = computed(() => ({
  bottom: `${((props.modelValue - props.min) / (props.max - props.min)) * 100}%`,
  cursor: isDragging.value ? 'grabbing' : 'grab'
}))

const mercuryColor = computed(() => {
  const percent = (props.modelValue - props.min) / (props.max - props.min)
  // Blue (200) → Purple (280) → Red (360/0)
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

  // Calculate new position (0-1)
  let position = 1 - (clientY - rect.top) / rect.height
  position = Math.max(0, Math.min(1, position)) // Clamp between 0-1

  // Calculate new value
  const range = props.max - props.min
  const newValue = props.min + position * range

  // Apply step if needed
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
  justify-content: center;
  pointer-events: none;
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
}

.mercury {
  position: absolute;
  bottom: 0;
  width: 100%;
  transition: height 0.2s ease;
  border-radius: 0 0 18px 18px;
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
  right: 30%;
  top: 0;
  bottom: 0;
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
  top: 0;
  bottom: 0;
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

/* Ensure ticks and labels align perfectly */
.ticks {
  right: 25px; /* Adjusted to make space for labels */
}

/* Adjust thermometer dimensions */
.thermometer {
  padding-right: 20px; /* Make room for labels */
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

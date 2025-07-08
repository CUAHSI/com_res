<template>
  <div class="thermometer-slider-container" :style="containerStyle">
    <div class="thermometer">
      <!-- Mercury fill -->
      <div class="mercury" :style="mercuryStyle"></div>

      <!-- Vuetify slider (transparent but handles interaction) -->
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

      <!-- Tick marks and labels -->
      <div class="ticks">
        <div
          v-for="(_, index) in ticks"
          :key="index"
          class="tick"
          :class="{ 'major-tick': index % majorTickInterval === 0 }"
          :style="{ bottom: `${(index / (ticks.length - 1)) * 100}%` }"
        ></div>
      </div>

      <div class="labels">
        <div
          v-for="(label, index) in labels"
          :key="index"
          class="label"
          :style="{ bottom: `${((label.value - min) / (max - min)) * 100}%` }"
        >
          {{ label.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

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
    default: '40px'
  },
  height: {
    type: String,
    default: '300px'
  },
  // Array of { value: Number, text: String } for labels
  labels: {
    type: Array,
    default: () => [
      { value: 0, text: '0°' },
      { value: 25, text: '25°' },
      { value: 50, text: '50°' },
      { value: 75, text: '75°' },
      { value: 100, text: '100°' }
    ]
  },
  // How often to show major ticks (every Nth tick)
  majorTickInterval: {
    type: Number,
    default: 2
  },
  // Number of ticks to display
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

const containerStyle = computed(() => ({
  width: props.width,
  height: props.height,
  right: '20px', // Adjust as needed for your map positioning
  top: '50%',
  transform: 'translateY(-50%)'
}))

const mercuryStyle = computed(() => ({
  height: `${((props.modelValue - props.min) / (props.max - props.min)) * 100}%`,
  backgroundColor: mercuryColor.value
}))

const mercuryColor = computed(() => {
  const percent = (props.modelValue - props.min) / (props.max - props.min)
  const hue = 200 + 160 * percent // 200 (blue) to 360 (red)
  return `hsl(${hue > 360 ? hue - 360 : hue}, 80%, ${70 - percent * 30}%)`
})
</script>

<style scoped>
.thermometer-slider-container {
  position: absolute;
  z-index: 10; /* Higher than your map */
  display: flex;
  justify-content: center;
  pointer-events: none; /* Allows clicks to pass through container */
}

.thermometer {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  border-radius: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  border: 2px solid #ddd;
  overflow: hidden;
  pointer-events: auto; /* Re-enable pointer events for thermometer */
}

.mercury {
  position: absolute;
  bottom: 0;
  width: 100%;
  transition: height 0.2s ease;
  border-radius: 0 0 18px 18px;
}

.slider-input {
  position: absolute;
  height: 100%;
  width: 100%;
  opacity: 0; /* Make slider transparent but still interactive */
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

.labels {
  position: absolute;
  left: calc(100% + 10px);
  top: 0;
  bottom: 0;
  width: 30px;
}

.label {
  position: absolute;
  transform: translateY(50%);
  font-size: 12px;
  color: #333;
  white-space: nowrap;
}
</style>

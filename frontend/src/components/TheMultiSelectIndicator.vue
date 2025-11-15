<template>
  <div class="multi-select-indicator" :class="{ 'has-too-many-features': !canSelectMoreFeatures }">
    <template v-if="canSelectMoreFeatures">
      🖱️ Multi-select Mode Active - Click features to select multiple
    </template>
    <template v-else> ⚠️ Maximum features selected </template>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useFeaturesStore } from '@/stores/features'
const featureStore = useFeaturesStore()
const { canSelectMoreFeatures } = storeToRefs(featureStore)
</script>

<style scoped>
.multi-select-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 123, 255, 0.9);
  color: white;
  padding: 12px 18px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: bold;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border: 2px solid white;
  animation: pulse 2s infinite;
  pointer-events: none;
}

.has-too-many-features {
  background: rgba(220, 53, 69, 0.9);
}
</style>

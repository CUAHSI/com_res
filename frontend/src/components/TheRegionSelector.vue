<template>
  <v-card
    class="region-selector"
    :class="{ 'mobile-region-selector': mdAndDown }"
    variant="flat"
  >
    <v-select
      v-model="selectedRegion"
      :items="regions"
      item-title="title"
      item-value="name"
      label="Select Region"
      density="compact"
      variant="outlined"
      hide-details
      @update:modelValue="handleRegionChange"
    ></v-select>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRegionsStore } from '@/stores/regions'
import { useDisplay } from 'vuetify'

const { mdAndDown } = useDisplay()
const regionsStore = useRegionsStore()

const regions = computed(() => regionsStore.regions)
const selectedRegion = ref(null)

onMounted(() => {
  if (regionsStore.currentRegion) {
    selectedRegion.value = regionsStore.currentRegion.name
  }
})

// Watch for changes to the current region
watch(
  () => regionsStore.currentRegion,
  (newRegion) => {
    if (newRegion) {
      selectedRegion.value = newRegion.name
    }
  }
)

const handleRegionChange = (regionName) => {
  regionsStore.setRegion(regionName)
}
</script>

<style scoped>
.region-selector {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 8px;
}

.mobile-region-selector {
  width: 250px;
}
</style>
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
import { ref, computed, onMounted } from 'vue'
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

const handleRegionChange = (regionName) => {
  regionsStore.setRegion(regionName)
}
</script>

<style scoped>
.region-selector {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99999;
  width: 300px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 8px;
}

.mobile-region-selector {
  width: 250px;
  top: 5px;
}
</style>
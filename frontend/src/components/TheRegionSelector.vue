<template>
  <v-card
    class="region-selector"
    :class="{ 'mobile-region-selector': mdAndDown }"
    variant="flat"
    :style="{ zIndex: zIndex }"
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
      :error="!selectedRegion"
      :menu-props="{ contentClass: 'region-selector-menu', zIndex: menuZIndex }"
    ></v-select>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRegionsStore } from '@/stores/regions'
import { useDisplay } from 'vuetify'
import { useRouter } from 'vue-router'

const { mdAndDown } = useDisplay()
const regionsStore = useRegionsStore()
const router = useRouter()

const props = defineProps({
  zIndex: {
    type: [Number, String],
    default: 999999
  }
})

const regions = computed(() => regionsStore.regions)
const selectedRegion = ref(null)

// Compute menu z-index to be slightly higher than the container
const menuZIndex = computed(() => {
  const baseZIndex = typeof props.zIndex === 'string' 
    ? parseInt(props.zIndex, 10) 
    : props.zIndex
  return baseZIndex + 1
})

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
  router.push({
    name: 'maps',
    query: {
      region: regionName
    }
  })
  
  regionsStore.setRegion(regionName)
}
</script>

<style scoped>
.region-selector {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  position: relative;
}

/* Make it more compact on mobile */
.mobile-region-selector {
  width: 200px;
}

/* Make the select field more compact */
:deep(.v-select .v-field) {
  font-size: 0.875rem;
}

:deep(.v-select .v-field .v-field__input) {
  min-height: 40px;
  padding-top: 0;
}
</style>
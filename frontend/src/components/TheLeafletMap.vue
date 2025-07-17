<template>
  <div v-show="$route.meta.showMap" ref="mapRef" id="mapContainer"></div>
</template>

<script setup>
import 'leaflet/dist/leaflet.css'
import { onMounted } from 'vue'
import { useMapStore } from '@/stores/map'

const mapStore = useMapStore()

onMounted(() => {
  mapStore.initializeMap('mapContainer')
})
</script>

<style scoped>
#mapContainer {
  width: 100%;
  height: 100%;
}
</style>

<template>
  <v-overlay :model-value="!mapStore.mapLoaded" class="align-center justify-center">
    <v-progress-circular indeterminate :size="128"></v-progress-circular>
  </v-overlay>
  <v-container v-if="!mdAndDown" fluid>
    <v-row fill-height style="height: calc(100vh - 165px)">
      <v-col v-if="showRiverDrawer" :cols="3" class="pa-0">
        <RiverDrawer v-if="showRiverDrawer" @toggle="toggleRiverDrawer" />
      </v-col>
      <v-divider v-if="showRiverDrawer" vertical></v-divider>
      <v-col :cols="getCols" class="pa-0">
        <TheLeafletMap />
      </v-col>
    </v-row>
  </v-container>
  <v-container v-else>
    <v-row style="height: 40vh">
      <TheLeafletMap />
    </v-row>
    <v-row style="height: 50vh">
      <v-col>
        <RiverDrawer />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import RiverDrawer from '../components/RiverDrawer.vue'
import TheLeafletMap from '@/components/TheLeafletMap.vue'
import { useMapStore } from '@/stores/map'
import { useDisplay } from 'vuetify'

const { mdAndDown } = useDisplay()
const mapStore = useMapStore()

const showRiverDrawer = ref(true)

const toggleRiverDrawer = async () => {
  const center = mapStore.mapObject.map.getCenter()
  showRiverDrawer.value = !showRiverDrawer.value
  await nextTick()
  mapStore.mapObject.map.invalidateSize(true)
  mapStore.mapObject.map.setView(center)
}

const getCols = computed(() => {
  // if all drawers are open, the map should take up 7 columns
  let cols = 12
  if (showRiverDrawer.value) {
    cols -= 3
  }
  return cols
})
</script>

<template>
  <v-overlay :model-value="!mapStore.mapLoaded" class="align-center justify-center">
    <v-progress-circular indeterminate :size="128"></v-progress-circular>
  </v-overlay>
  <v-container v-if="!mdAndDown" fluid>
    <v-row fill-height style="height: calc(100vh - 165px)">
      <v-btn
        @click="toggleRiverDrawer"
        color="secondary"
        location="left"
        style="z-index: 9999"
        :style="{ transform: translateFilter(), position: 'absolute' }"
        :icon="showRiverDrawer ? mdiChevronLeft : mdiChevronRight"
        size="x-small"
      >
      </v-btn>
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
import { mdiChevronLeft, mdiChevronRight } from '@mdi/js'

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

const translateFilter = () => {
  if (showRiverDrawer.value) {
    return 'translate(24vw, 0)'
  } else {
    return 'translate(0, 0)'
  }
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

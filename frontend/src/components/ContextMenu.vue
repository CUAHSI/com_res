<template>
  <div
    v-if="context.show"
    class="context-menu-container"
    :style="{ left: context.x + 'px', top: context.y + 'px' }"
  >
    <v-card elevation="4" :disabled="context.pending">
      <div class="d-flex justify-end">
        <v-btn icon size="x-small" variant="text" @click="$emit('dismiss')" class="close-button">
          <v-icon>{{ mdiClose }}</v-icon>
        </v-btn>
      </div>
      <v-list density="compact">
        <v-list-item v-if="multiReachMode" @click="$emit('select-additional-feature')">
          <v-list-item-title>Select Additional Feature</v-list-item-title>
        </v-list-item>
        <v-list-item @click="$emit('zoom-to-feature')">
          <v-list-item-title>Zoom to Feature</v-list-item-title>
        </v-list-item>
        <v-list-item @click="$emit('select-feature')">
          <v-list-item-title>Select Feature</v-list-item-title>
        </v-list-item>
        <v-list-item @click="$emit('show-feature-info')">
          <v-list-item-title>Show Feature Info</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
    <v-progress-linear v-if="context.pending" indeterminate color="primary"></v-progress-linear>
  </div>
</template>

<script setup>
defineProps({
  context: {
    type: Object,
    required: true
  }
})

defineEmits(['close', 'zoom-to-feature', 'select-feature', 'select-additional-feature', 'show-feature-info', 'dismiss'])

import { mdiClose } from '@mdi/js'
import { useFeaturesStore } from '@/stores/features'
import { storeToRefs } from 'pinia'

const featureStore = useFeaturesStore()
const { multiReachMode } = storeToRefs(featureStore)
</script>

<style scoped>
.context-menu-container {
  position: fixed;
  z-index: 10000;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translate(-50%, 0); /* Center the menu horizontally on the point */
}

.context-menu-container .v-card {
  min-width: 180px;
}
</style>

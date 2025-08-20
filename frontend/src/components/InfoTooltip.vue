<template>
  <v-tooltip :location="popupLocation" max-width="200px" style="white-space: normal">
    <template #activator="{ props }">
      <v-icon
        v-bind="props"
        :icon="mdiInformationOutline"
        color="info"
        style="cursor: pointer; margin-left: 10px"
      >
      </v-icon>
    </template>
    <div>{{ props.text }}</div>
  </v-tooltip>
</template>

<script setup>
import { mdiInformationOutline } from '@mdi/js'
const props = defineProps({
  text: { type: String, default: '' },
  popupLocation: { type: String, default: 'bottom' }
})
</script>

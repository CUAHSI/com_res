<template>
  <v-tooltip :location="popupLocation" max-width="200px" class="info-tooltip">
    <template #activator="{ props }">
      <v-icon v-bind="props" :icon="mdiInformationOutline" :size="size" color="info"
        style="cursor: pointer; margin-left: 10px">
      </v-icon>
    </template>
    <div>{{ props.text }}</div>
  </v-tooltip>
</template>

<script setup>
import { mdiInformationOutline } from '@mdi/js'
const props = defineProps({
  text: { type: String, default: '' },
  popupLocation: { type: String, default: 'bottom' },
  size: { type: String, default: 'small' }
})
</script>

<style scoped>
.info-tooltip {
  z-index: 99999 !important;
  white-space: normal;
}
</style>
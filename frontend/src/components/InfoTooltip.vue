<template>
  <v-tooltip
    :location="location"
    :max-width="maxWidth"
    :content-class="contentClass"
    :z-index="zIndex"
  >
    <template #activator="{ props: act }">
      <v-icon
        v-bind="act"
        :icon="mdiInformationOutline"
        color="info"
        class="cursor-pointer ml-2"
      />
    </template>

    <div class="whitespace-normal">{{ text }}</div>
  </v-tooltip>
</template>

<script setup>
import { mdiInformationOutline } from '@mdi/js'

const { text, contentClass, zIndex, location, maxWidth } = defineProps({
  text: { type: String, default: '' },
  contentClass: { type: String, default: '' }, // lets us target the teleported overlay
  zIndex: { type: [Number, String], default: 200000 }, // render above plot container (99999)
  location: { type: String, default: 'bottom' },
  maxWidth: { type: [Number, String], default: 200 }
})
</script>

<style scoped>
.whitespace-normal { white-space: normal; }
.ml-2 { margin-left: 10px; }
.cursor-pointer { cursor: pointer; }
</style>

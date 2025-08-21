<template>
  <v-menu
    :model-value="context.show"
    :position-x="context.x"
    :position-y="context.y"
    absolute
    offset-y
  >
    <v-list density="compact">
      <v-list-item @click="zoomToFeature">
        <v-list-item-title>Zoom to Feature</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
const emit = defineEmits(['zoom-to-feature'])

defineProps({
  context: {
    type: Object,
    default: () => context.value
  }
})

function zoomToFeature() {
  if (context.value.feature) {
    emit('zoom-to-feature', context.value.feature)
  }
  context.value.show = false
}

// Expose method to open the menu
function openMenu(event, feature) {
  context.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    feature: feature
  }
}

defineExpose({
  openMenu
})
</script>
<template>
  <div v-if="context.show" class="context-menu-container" :style="{ left: context.x + 'px', top: context.y + 'px' }">
    <v-card elevation="4">
      <v-list density="compact">
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
  </div>
</template>

<script setup>
defineProps({
  context: {
    type: Object,
    required: true
  }
})

defineEmits(['close', 'zoom-to-feature', 'select-feature', 'show-feature-info'])
</script>

<style scoped>
.context-menu-container {
  position: fixed;
  z-index: 10000;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.context-menu-container .v-card {
  min-width: 180px;
}
</style>
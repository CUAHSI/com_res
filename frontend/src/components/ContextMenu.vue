<template>
  <v-menu
    :model-value="context.show"
    :position-x="context.x"
    :position-y="context.y"
    absolute
    offset-y
    @update:model-value="$emit('close')"
  >
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
  </v-menu>
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
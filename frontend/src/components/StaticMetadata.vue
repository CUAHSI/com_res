<template>
  <v-sheet class="mx-auto" elevation="8">
    {{ featureStore.activeFeature.properties }}
  </v-sheet>
</template>

<script setup>
import { useFeaturesStore } from '@/stores/features'

const featureStore = useFeaturesStore()
</script>

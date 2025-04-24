<template>
  <v-navigation-drawer
    v-if="featureStore.activeFeature"
    location="right"
    width="auto"
    v-model="show"
    order="1"
  >
    <v-container v-if="featureStore.activeFeature">
      <v-btn
        v-if="featureStore.activeFeature"
        @click="show = !show"
        location="left"
        order="0"
        postition="absolute"
        :style="{ bottom: '30%', transform: translate(), position: 'absolute' }"
        :icon="show ? mdiChevronRight : mdiChevronLeft"
      >
      </v-btn>
      <StaticMetadata />
    </v-container>
  </v-navigation-drawer>
</template>

<script setup>
import { ref } from 'vue'
import { useFeaturesStore } from '@/stores/features'
import { mdiChevronRight, mdiChevronLeft } from '@mdi/js'
import StaticMetadata from './StaticMetadata.vue'

const featureStore = useFeaturesStore()

let show = ref(false)

const translate = () => {
  if (show.value) {
    return 'translate(-50%, 0)'
  } else {
    return 'translate(-180%, 0)'
  }
}

featureStore.$subscribe((mutation, state) => {
  if (state.activeFeature !== null) {
    // && typeof mutation.events.newValue === 'object'
    show.value = true
  }
})
</script>

<style scoped>
.v-navigation-drawer--mini-variant,
.v-navigation-drawer {
  overflow: visible !important;
}
</style>

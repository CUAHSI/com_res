<template>
  <v-dialog
    v-model="need_disclaimer"
    max-width="800"
    persistent
    scrollable
    transition="dialog-bottom-transition"
    class="pa-4"
    :style="{ zIndex: zIndex }"
  >
    <v-card :prepend-icon="mdiAlertCircle" title="Disclaimer">
      <v-card-text>
        <p>
          FloodSavvy is an <span style="color:red; font-weight:600;">experimental</span>
          application that visualizes potential <strong>inundation flooding</strong>
          based on forecasts from NOAA's National Water Model (NWM) and its associated
          Flood Inundation Mapping (FIM) services. 
        </p>

        <p>
          This tool <strong>does not provide fluvial erosion information</strong> or other
          flood-related hazards beyond inundation, as these processes are
          <strong>not modeled by the NWM</strong>.
        </p>

        <p>
          While FloodSavvy offers useful insights into where inundation may occur,
          all outputs are estimates and include inherent uncertainty.
          These maps are <strong>NOT official flood products</strong> from NOAA or the
          National Weather Service, although they draw on similar methodologies to NOAA’s
          experimental FIM services.
        </p>

        <p>
          FloodSavvy is intended to support public understanding and exploration of
          historical and potential future flood scenarios using publicly available data.
          For <strong>official and authoritative flood forecasts, warnings, and maps</strong>,
          please refer to the <span style="color:darkcyan; font-weight:600;">NWPS Resources</span> available under the <strong>Resources</strong> tab.
        </p>

        <p>
          FloodSavvy is for <strong>informational and educational use only</strong> and
          should <strong>NOT</strong> be relied upon for emergency decision-making or as a
          substitute for official guidance.
        </p>
        <!-- Logo row -->
        <v-row class="mt-4" justify="space-around" align="center">
          <v-col v-for="(logo, index) in logos" :key="index" cols="12" sm="4" md="3">
            <v-img
              :src="logo.image"
              :alt="logo.alt"
              :lazy-src="logo.image"
              contain
              height="100"
              class="mx-auto"
              :cover="logo.shouldCover !== false"
            ></v-img>
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          text="Acknowledge"
          variant="tonal"
          @click="dismiss_disclaimer"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { mdiAlertCircle } from '@mdi/js'
import { useAlertStore } from '@/stores/alerts'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import CIROH from '@/assets/CIROH_black.png'
import CUAHSI from '@/assets/logo.png'
import GRI from '@/assets/GRI_RGB_Monogram_Red+B.png' // Example logo, replace with actual path

const alertStore = useAlertStore()
const { need_disclaimer } = storeToRefs(alertStore)

const props = defineProps({
  zIndex: {
    type: [Number, String],
    default: 9999999
  }
})

// Compute content z-index to be slightly higher than the container
const contentZIndex = computed(() => {
  const baseZIndex = typeof props.zIndex === 'string' ? parseInt(props.zIndex, 10) : props.zIndex
  return baseZIndex + 1
})

const logos = [
  { image: CIROH, alt: 'CIROH', shouldCover: false },
  { image: CUAHSI, alt: 'CUAHSI', shouldCover: false },
  { image: GRI, alt: 'Global Resilience Institute', shouldCover: true }
]

function dismiss_disclaimer() {
  alertStore.acceptDisclaimer()
}
</script>

<style scoped>
.disclaimer-dialog-container {
  position: relative;
  z-index: v-bind(zIndex);
}
</style>

<style>
.disclaimer-dialog-content {
  z-index: v-bind(contentZIndex) !important;
}
</style>

<template>
  <div class="pa-4 text-center">
    <v-dialog
      v-model="need_disclaimer"
      max-width="800"
      persistent
      scrollable
      transition="dialog-bottom-transition"
    >
      <v-card :prepend-icon="mdiAlertCircle" title="Disclaimer">
        <v-card-text>
          <p>
            FloodWise is an experimental application that provides visualizations of potential flood
            extents based on forecasts from NOAA's National Water Model and associated flood
            inundation mapping (FIM) services. While FloodWise aims to offer useful insights into
            where flooding may occur, the outputs are estimates and inherently include uncertainty.
            These maps are not official flood products from NOAA or the National Weather Service,
            although they utilize methodologies similar to those found in NOAA's experimental FIM
            services. The purpose of FloodWise is to support public understanding and exploration of
            historical and potential future flood scenarios. All underlying data are sourced from
            publicly available datasets. For official flood forecasts, warnings, and authoritative
            flood maps, please refer to the resources provided in the "Resources" tab. FloodWise is
            intended for informational and educational use only and should not be relied upon for
            emergency decision-making or as a substitute for official guidance.
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
  </div>
</template>

<script setup>
import { mdiAlertCircle } from '@mdi/js'
import { useAlertStore } from '@/stores/alerts'
import { storeToRefs } from 'pinia'

import CIROH from '@/assets/CIROH.png'
import CUAHSI from '@/assets/CUAHSI.png'
import GRI from '@/assets/GRI_RGB_Monogram_Red+B.png' // Example logo, replace with actual path

const alertStore = useAlertStore()
const { need_disclaimer } = storeToRefs(alertStore)

const logos = [
  { image: CIROH, alt: 'CIROH', shouldCover: false },
  { image: CUAHSI, alt: 'CUAHSI', shouldCover: false },
  { image: GRI, alt: 'Global Resilience Institute', shouldCover: true }
]

function dismiss_disclaimer() {
  alertStore.acceptDisclaimer()
}
</script>

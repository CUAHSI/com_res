<template>
  <div class="pa-4 text-center">
    <v-dialog
      v-model="need_noaa_alert"
      max-width="600"
      persistent
      scrollable
      transition="dialog-bottom-transition"
    >
      <v-card :prepend-icon="mdiAlertCircle" title="NOAA ACCEPTANCE">
        <v-card-text>
          <p>
            FloodWise is an experimental application that provides visualizations of potential flood
            extents based on forecasts from NOAA’s National Water Model and associated flood
            inundation mapping (FIM) services. While FloodWise aims to offer useful insights into
            where flooding may occur, the outputs are estimates and inherently include uncertainty.
            These maps are not official flood products from NOAA or the National Weather Service,
            although they utilize methodologies similar to those found in NOAA’s experimental FIM
            services. The purpose of FloodWise is to support public understanding and exploration of
            historical and potential future flood scenarios. All underlying data are sourced from
            publicly available datasets. For official flood forecasts, warnings, and authoritative
            flood maps, please refer to the resources provided in the “Resources” tab. FloodWise is
            intended for informational and educational use only and should not be relied upon for
            emergency decision-making or as a substitute for official guidance.
          </p>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text="Accept" variant="tonal" @click="dismiss_noaa_alert"></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script setup>
import { mdiAlertCircle } from '@mdi/js'
import { useAlertStore } from '@/stores/alerts'
import { storeToRefs } from 'pinia'

const alertStore = useAlertStore()
const { need_noaa_alert } = storeToRefs(alertStore)

function dismiss_noaa_alert() {
  alertStore.acceptNoaaAlert()
}
</script>

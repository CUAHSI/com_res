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
            The FloodWise application is an experimental tool that shows where flooding might happen
            based on NOAA’s National Water Model forecasts and their flood inundation mapping (FIM)
            services. FloodWise gives an estimate of floodwater extent, but it is not exact and has
            some uncertainty. Please note that these maps are not official flood maps from NOAA or
            the National Weather Service. However, they use similar methods to those used in NOAA’s
            experimental FIM service. The goal is to help communities and stakeholders explore
            possible flooding scenarios, both from the past and what might happen in the future. All
            data used in these maps come from public sources and are freely available for public
            use. If you're looking for official flood maps, data, or warnings, please visit the
            “Resources” tab, where you can find several links to official products. Please keep in
            mind: FloodWise maps are for exploration and learning only, and do not replace official
            flood forecasts or warnings.
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

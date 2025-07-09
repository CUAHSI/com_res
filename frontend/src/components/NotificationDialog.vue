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
          <p>By accepting this notification, you agree to the terms and conditions.</p>
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

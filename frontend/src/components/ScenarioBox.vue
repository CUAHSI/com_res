<template>
  <v-sheet
    class="pa-4 resource-box mb-6"
    elevation="0"
    rounded
    :id="id"
  >
    <h4 class="ma-2 section-subtitle">{{ title }}</h4>
    <p>{{ description }}</p>

    <v-row class="mt-4" dense>
      <!-- PDF -->
      <v-col cols="12" md="6">
        <v-card
          class="overflow-hidden"
          style="border-radius: 6px; cursor: pointer;"
          @click="openPdf(taskPdf, title)"
        >
          <iframe
            :src="taskPdf + '#page=1&view=fitH&toolbar=0'"
            :title="title + ' Task PDF'"
            style="width: 100%; height: 250px; border: none;"
          ></iframe>
          <v-card-text
            class="text-center"
            style="font-size: 0.9rem; color: #1976d2;"
          >
            📋 View Task PDF
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Video -->
      <v-col cols="12" md="6">
        <v-card class="overflow-hidden" style="border-radius: 6px;">
          <iframe
            width="100%"
            height="250"
            :src="videoUrl"
            :title="title + ' Walkthrough'"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            style="border-radius: 6px;"
          ></iframe>
          <v-card-text
            class="text-center"
            style="font-size: 0.9rem; color: #424242;"
          >
            🎥 Watch Tutorial Video
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-sheet>
</template>

<script setup>
import { inject } from "vue";

defineProps({
  id: String,
  title: String,
  description: String,
  taskPdf: String,
  videoUrl: String,
});

const openPdf = inject("openPdf");
</script>

<style scoped> 
.section-subtitle { 
  color: rgb(24, 123, 112); 
  font-size: 18px; 
}  
</style>
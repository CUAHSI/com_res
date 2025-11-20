<template>
  <v-sheet :id="id" class="pa-4 resource-box mb-6" elevation="0" rounded>
    <h4 class="ma-2 section-subtitle">
      {{ title }}
    </h4>
    <p>{{ description }}</p>

    <v-row class="mt-4" dense>
      <!-- PDF preview card -->
      <v-col cols="12" md="6">
        <v-card class="scenario-card" @click="openTaskPdf">
          <div class="pdf-preview-wrapper">
            <iframe
              class="pdf-preview"
              :src="taskPdf + '#page=1&zoom=100&toolbar=0&scrollbar=0'"
              :title="title"
            />
          </div>

          <v-card-text class="text-center" style="font-size: 0.9rem; color: #1976d2">
            {{ pdfLabel }}
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Video placeholder card -->
      <v-col cols="12" md="6">
        <v-card class="scenario-card">
          <div class="pdf-preview-wrapper">
            <div class="video-placeholder">🎥 Video</div>
          </div>

          <v-card-text class="text-center" style="font-size: 0.9rem; color: #424242">
            Tutorial Video (Coming Soon)
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-sheet>
</template>

<script setup>
const props = defineProps({
  id: { type: String, default: '' },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  taskPdf: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  pdfLabel: {
    type: String,
    default: '📋 View Task PDF'
  }
})

const openTaskPdf = () => {
  window.open(props.taskPdf, '_blank')
}
</script>

<style scoped>
.section-subtitle {
  color: rgb(24, 123, 112);
  font-size: 18px;
}

/* Equal size card container */
.scenario-card {
  border-radius: 6px;
  cursor: pointer;
  height: 260px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  transition: 0.2s;
}
.scenario-card:hover {
  transform: scale(1.02);
}

/* PDF preview styling */
.pdf-preview-wrapper {
  height: 75%;
  overflow: hidden;
  border-radius: 6px 6px 0 0;
}
.pdf-preview {
  width: 100%;
  height: 100%;
  border: none;
  pointer-events: none; /* makes it preview only */
}

/* Placeholder for videos */
.video-placeholder {
  height: 100%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #777;
  font-size: 1rem;
}

/* Footer label */
.scenario-label {
  text-align: center;
  font-size: 0.9rem;
  color: #424242;
  padding-top: 6px;
}

.pdf-label {
  color: #1976d2;
}
</style>

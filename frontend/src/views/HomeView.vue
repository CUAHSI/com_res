<template>
  <v-container fluid>
    <v-row class="fill-height">
      <v-col>
        <div>
          <div>
            <p class="font-weight-light text-subtitle">
              {{ loremIpsum({ count: 2, units: 'paragraph' }) }}
            </p>
          </div>
        </div>
        <p class="subheading"></p>
      </v-col>
    </v-row>
    <v-row align="center" justify="center">
      <v-col v-for="region in regionsStore.regions" :key="region.text">
        <v-card
          class="pa-2"
          color="secondary"
          style="height: 400px"
          @click="handleCardClick(region)"
        >
          <v-img :src="region.image" :lazy-src="region.image" style="max-height: 200px"></v-img>
          <v-card-title>
            <span>{{ region.title }}</span>
          </v-card-title>
          <v-card-text>
            <span>{{ region.text }}</span>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { loremIpsum } from 'lorem-ipsum'
import { useRouter } from 'vue-router'
import { useRegionsStore } from '../stores/regions'

const emit = defineEmits(['region-selected'])
const router = useRouter()
const regionsStore = useRegionsStore()

const handleCardClick = (region) => {
  const bounds = region.bounds

  // Emit an event to the parent component with the selected region's bounds
  emit('region-selected', { bounds })

  // Use the router to navigate to the maps view
  router.push({
    name: 'maps',
    query: {
      region: region.name
    }
  })
}
</script>

<style scoped>
.regions {
  gap: 2rem 4rem;

  a {
    max-width: 100%;

    img {
      max-height: 5rem;
      max-width: 100%;
    }
  }
}
</style>

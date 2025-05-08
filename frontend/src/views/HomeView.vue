<template>
  <v-container fluid>
    <v-row class="fill-height">
      <v-col>
        <div>
          <div>
            <p class="font-weight-light text-subtitle" style="padding: 10px 20px">
              This application was established to provide a user-centered perspective on integrating
              the National Water Model (NWM) into community resilience planning and water
              decision-making processes across selected regions in Vermont and Missouri. In Vermont,
              the research focused on three regions: Two Rivers-Ottauquechee, Mt. Ascutney, and
              Windham. In Missouri, the study engaged with three distinct communities: Springfield,
              De Soto, and Roaring River State Park. The methods were designed to understand each
              community's unique context, including their water-related vulnerabilities, resilience
              planning constraints, and information and data gaps, to develop a series of resources
              of the NWM that could best help aid their particular needs.
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
import { useRouter } from 'vue-router'
import { useRegionsStore } from '../stores/regions'

const router = useRouter()
const regionsStore = useRegionsStore()

const handleCardClick = (region) => {
  // Use the router to navigate to the maps view
  router.push({
    name: 'maps',
    query: {
      region: region.name
    }
  })

  // set the current region in the store
  regionsStore.currentRegion = region
  // regionsStore.onRegionChange(region.name)
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

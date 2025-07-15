<template>
  <v-container fluid>
    <v-row class="fill-height">
      <v-col>
        <v-sheet class="pa-6 mx-auto ma-4" max-width="1200" rounded>
          <p>
            This application was established to provide a user-centered perspective on integrating
            the National Water Model (NWM) into community resilience planning and water
            decision-making processes across selected regions in <strong>Missouri</strong> and
            <strong>Vermont</strong>. In Missouri, the study engaged with three distinct
            communities: <span style="color: #0d47a1">Springfield</span>,
            <span style="color: #0d47a1">De Soto</span>, and
            <span style="color: #0d47a1">Roaring River State Park</span>. In Vermont, the research
            focused on three regions: <span style="color: #0d47a1">Two Rivers-Ottauquechee</span>,
            <span style="color: #0d47a1">Mt. Ascutney</span>, and
            <span style="color: #0d47a1">Windham</span>. The methods were designed to understand
            each community's unique context, including their water-related vulnerabilities,
            resilience planning constraints, and information and data gaps, to develop a series of
            resources of the NWM that could best help aid their particular needs.
          </p>
        </v-sheet>
        <p class="subheading"></p>
      </v-col>
    </v-row>
    <v-sheet class="pa-6 mx-auto ma-4" max-width="1200" rounded>
      <h3 class="text-center mb-4">Regions in Missouri</h3>
      <v-row align="center" justify="center">
        <v-col
          v-for="region in regionsStore.regions.slice(0, 3)"
          :key="region.text"
          cols="12"
          sm="6"
          md="4"
          class="d-flex justify-center"
        >
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
    </v-sheet>

    <v-sheet class="pa-6 mx-auto ma-4" max-width="1200" rounded>
      <h3 class="text-center mb-4">Regions in Missouri</h3>
      <v-row align="center" justify="center">
        <v-col
          v-for="region in regionsStore.regions.slice(3, 6)"
          :key="region.text"
          cols="12"
          sm="6"
          md="4"
          class="d-flex justify-center"
        >
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
    </v-sheet>
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

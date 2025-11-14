<template>
  <v-container fluid>
    <!-- === Banner section === -->
    <v-sheet class="banner d-flex flex-column align-center justify-center pa-6" rounded>
      <h2 class="mb-2 banner-title">FloodSavvy</h2>
      <p class="banner-text">
        Turning NOAA’s National Water Model data into clear, local flood risk insights.
      </p>
    </v-sheet>
    <!-- ===================== -->

    <v-row>
      <v-col>
        <v-sheet class="section section--tight-below mx-auto" max-width="1200" rounded>
          <p class="mt-0 mb-0">
            <strong>FloodSavvy</strong> is a resource that pilots new ways to access and visualize
            information available from
            <a href="https://water.noaa.gov" target="_blank" rel="noopener noreferrer"
              >NOAA’s National Water Model</a
            >. The web-based interface offers the ability to assess local water-related risks,
            monitor streamflow conditions, and visualise potential flood inundation extents. It was
            developed in partnership with selected communities in <strong>Vermont</strong> and
            <strong>Missouri</strong> to help strengthen community resilience planning and
            water-related decision-making. In Missouri, the study engaged with three distinct
            communities: City of Springfield-Greene County, City of De Soto, and Roaring River State
            Park. In Vermont, the research focused on three Regional Planning Commissions and the
            member towns they support: Two Rivers-Ottauquechee, Mt. Ascutney, and Windham.
          </p>
        </v-sheet>
      </v-col>
    </v-row>

    <v-sheet
      class="section section--tight-above section--loose-below mx-auto"
      max-width="1200"
      rounded
    >
      <h3 class="section-title section-title--more-below">What can I do with FloodSavvy?</h3>
      <v-row class="mt-0" align="center" justify="center">
        <v-col
          v-for="(item, index) in features"
          :key="index"
          cols="12"
          sm="6"
          md="4"
          class="pa-1 d-flex"
        >
          <v-sheet
            class="feature-box pa-4 d-flex flex-column align-center text-center"
            elevation="0"
            rounded
          >
            <v-icon size="28" color="primary" class="mb-2">{{ item.icon }}</v-icon>
            <h4 class="feature-title mb-1">{{ item.title }}</h4>
            <p class="feature-text">{{ item.text }}</p>
          </v-sheet>
        </v-col>
      </v-row>
    </v-sheet>

    <v-sheet
      class="section section--tight-above section--tight-below mx-auto"
      max-width="1200"
      rounded
    >
      <h3 class="section-title section-title--more-below">How do I get started?</h3>
      <p class="mb-0">
        To use the FloodSavvy capabilities described above, please select your local region below or
        visit the MAPS page and select your region from the dropdown. This is intended to be used by
        the individuals and organizations affiliated with the six regions in our project, who are
        interested in accessing National Water Model (NWM) information.
      </p>
    </v-sheet>

    <v-sheet class="section section--no-top mx-auto" max-width="1200" rounded>
      <p class="regions-title">Regions in Missouri</p>
      <v-row class="mt-0" align="center" justify="center">
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

    <v-sheet class="section section--no-top mx-auto" max-width="1200" rounded>
      <p class="regions-title">Regions in Vermont</p>
      <v-row class="mt-0" align="center" justify="center">
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

    <v-sheet class="pa-4 mx-auto ma-2" max-width="1200" rounded>
      <p class="mt-0">
        For more information on how to use the FloodSavvy interface as well as NOAA’s current
        products, including the National Water Prediction Service (NWPS) and the NWM, please visit
        the <router-link to="/resources">RESOURCES</router-link> page. The tutorial-style resources
        for the NWPS and the NWM are intended to assist all users in navigating, extracting, and
        assessing flood risk insights. To find out more about the project and how the FloodSavvy
        resource was co-developed with the six communities, please visit the
        <router-link to="/about">ABOUT</router-link> page. If you have any questions or would like
        to report any issues while using the FloodSavvy website, please visit the
        <router-link to="/contact">CONTACT</router-link> page.
      </p>
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

const features = [
  {
    title: 'Easy Site Selection',
    text: 'Quickly navigate between six study areas with site-specific maps and info.'
  },
  {
    title: 'Tailored Map Interface',
    text: 'Focused maps highlight only the active watershed and hydrology features.'
  },
  {
    title: 'Monitor Streamflow with Interactive Graphs',
    text: 'View historical and 10-day forecast streamflow on simple charts.'
  },
  {
    title: 'Visualize and Explore Flood Scenarios',
    text: 'See pre-computed flood maps under different streamflow conditions.'
  },
  {
    title: 'Explore Water Data Trends',
    text: 'Investigate long-term hydrologic patterns across your region.'
  },
  {
    title: 'Download and Share Insights',
    text: 'Export maps, graphs, and data to support local decision-making.'
  }
]
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
.banner {
  --banner-bg: rgba(36, 40, 40, 0.75);
  --banner-fg: #ffffff;
  --banner-title: #ffffff;

  background-color: var(--banner-bg);
  color: var(--banner-fg);
}
.banner .banner-title {
  color: var(--banner-title);
  font-weight: 600;
  font-size: 2rem;
}
.banner .banner-text {
  color: var(--banner-fg) !important;
  font-size: 1.5rem;
  line-height: 1.3;
}
.feature-box {
  background-color: #f0f0f0;
  border-left: 4px solid #9e9e9e;
  border-radius: 12px;
}
.feature-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}
.feature-text {
  font-size: 0.875rem;
  line-height: 1.35;
  margin: 0;
  color: #333;
}
.section {
  padding: 16px 24px;
}
.section--tight-above {
  padding-top: 8px !important;
}
.section--loose-below {
  padding-bottom: 20px !important;
}
.section--tight-below {
  padding-bottom: 0 !important;
}
.section--no-top {
  padding-top: 0 !important;
}
.section-title {
  margin: 4px 0 12px 0;
  text-align: center;
  color: rgba(44, 136, 151, 0.936);
}
.section-title--more-below {
  margin-bottom: 16px;
}
.regions-title {
  text-align: center;
  margin: 0 0 6px 0;
  font-weight: 600;
}
p {
  margin-top: 0;
}
.v-row {
  margin-top: 0 !important;
}
.v-col {
  padding-top: 4px !important;
}
</style>

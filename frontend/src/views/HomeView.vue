<template>
  <v-container fluid>
    <!-- === Banner section === -->
    <v-sheet class="banner d-flex flex-column align-center justify-center pa-6 text-center" rounded>
      <h2 class="mb-2 banner-title">Translating NOAA’s National Water Model data into 
        easy-to-understand flood risk insights</h2>
      <!-- <p class="banner-text">
        Turning NOAA’s National Water Model data into clear, local flood risk insights.
      </p> -->
    </v-sheet>
    <!-- ===================== -->

    <!-- === Slideshow Section (Image + Text Underneath) === -->
    <v-sheet class="slideshow-wrapper mx-auto my-4" max-width="1200" rounded>
      <v-carousel
        height="380"
        cycle
        interval="6000"
        hide-delimiter-background
        show-arrows="hover"
      >
        <v-carousel-item
          v-for="(slide, i) in slides"
          :key="i"
        >
          <div class="slide-container">
            <v-img :src="slide.image" cover height="300" class="slideshow-image" />
            
            <!-- Text BELOW the image -->
            <div class="slideshow-caption">
              <p class="caption-text">{{ slide.text }}</p>
            </div>
          </div>
        </v-carousel-item>
      </v-carousel>
    </v-sheet>
    <!-- ================= -->

    <v-row>
      <v-col>
        <v-sheet class="section section--tight-below mx-auto" max-width="1200" rounded>
          <p class="mt-0 mb-0">
            <strong>FloodSavvy</strong> is a resource that pilots new ways to access and visualize
            information available from
            <a href="https://water.noaa.gov" target="_blank" rel="noopener noreferrer"
              >NOAA’s National Water Model</a
            >. The web-based interface offers the ability to assess local water-related risks,
            monitor streamflow conditions, and visualize potential flood inundation extents. It was
            developed in partnership with six communities in <strong>Vermont</strong> and
            <strong>Missouri</strong> to help strengthen community resilience planning and
            water-related decision-making. In Missouri, the study engaged with three
            communities: the City of De Soto, the City of Springfield-Greene County, and Roaring River State
            Park. In Vermont, the research focused on three Regional Planning Commissions and the
            member towns they support: 
            <a href="https://www.marcvt.org/" target="_blank" rel="noopener noreferrer">Mt. Ascutney</a>,
            <a href="https://www.trorc.org/" target="_blank" rel="noopener noreferrer">Two Rivers-Ottauquechee</a>, 
            and Windham.
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
        For more information on how to use the FloodSavvy interface as well as NOAA’s 
        current products, including the National Water Prediction Service (NWPS) and 
        the NWM, please visit the <router-link to="/resources">RESOURCES</router-link> page. The tutorial-style resources 
        for the NWPS and the NWM are intended to assist all users in navigating, extracting, 
        and assessing flood risk insights.
        To find out more about the project and how the FloodSavvy resource was co-developed 
        with the six communities, please visit the <router-link to="/about">ABOUT</router-link> page. 
        If you have any questions or would like to report any issues while using the FloodSavvy 
        website, please visit the <router-link to="/contact">CONTACT</router-link> page.  
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

import img1 from '@/assets/Feature1-map-selection.png'
import img2 from '@/assets/Feature2-plots.png'
import img3 from '@/assets/Feature3-flood-maps.png'

const slides = [
  { image: img1, text: 'Easy Site Selection with a tailored map interface that helps you navigate regions.' },
  { image: img2, text: 'Monitor Streamflow through interactive graphs that show historical conditions and 10-day forecasts.' },
  { image: img3, text: 'Visualize Flood Scenarios using pre-computed flood maps that show how different streamflow levels could affect surrounding areas.' }
]

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
  --banner-bg: #ffffff;
  --banner-fg: #125664;
  --banner-title: #0e427d; 

  background-color: var(--banner-bg);
  color: var(--banner-fg);
}
.banner .banner-title {
  color: var(--banner-title);
  font-weight: 800;
  font-size:1.6rem;
  text-align: center;
}
.banner .banner-text {
  color: var(--banner-fg) !important;
  font-size: 1.5rem;
  line-height: 1.3;
}
.slideshow-wrapper {
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 0 3px 12px rgba(0,0,0,0.1);
  background: white; /* ensures bright background behind captions */
}

.slide-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.slideshow-image {
  object-fit: cover;
  border-bottom: 1px solid #ddd;
}

.slideshow-caption {
  padding: 16px 20px;
  text-align: center;
}

.caption-text {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 500;
  color: #0e427d; 
  line-height: 1.4;
}

/* mobile adjustments */
@media (max-width: 600px) {
  .caption-text {
    font-size: 0.9rem;
  }
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

<template>
  <v-container fluid>
    <!-- === Banner section === -->
    <v-sheet class="banner d-flex flex-column align-center justify-center pa-6 text-center" rounded>
      <h2 class="mb-2 banner-title">
        Translating NOAA’s National Water Model data into easy-to-understand flood risk insights
      </h2>
    </v-sheet>

    <!-- === Slideshow Section === -->
    <v-sheet class="slideshow-wrapper mx-auto my-4" max-width="1200" rounded>
      <v-carousel height="380" cycle interval="6000" hide-delimiter-background show-arrows="hover">
        <v-carousel-item v-for="(slide, i) in slides" :key="i">
          <div class="slide-container">
            <v-img :src="slide.image" height="300" cover class="slideshow-image" />
            <div class="slideshow-caption">
              <p class="caption-text">{{ slide.text }}</p>
            </div>
          </div>
        </v-carousel-item>
      </v-carousel>
    </v-sheet>

    <!-- === Intro Paragraph === -->
    <v-row>
      <v-col>
        <v-sheet class="section section--tight-below mx-auto" max-width="1200" rounded>
          <p>
            <strong>FloodSavvy</strong> is a resource that pilots new ways to access and visualize
            information available from
            <a href="https://water.noaa.gov" target="_blank" rel="noopener noreferrer">NOAA’s National Water Model</a>.
            The web-based interface offers the ability to assess water-related risks, monitor streamflow,
            and visualize flood inundation extents. It was developed in partnership with six communities  
            across <strong>Vermont</strong> and <strong>Missouri</strong>.
            In Missouri: City of De Soto, City of Springfield–Greene County, Roaring River State Park.  
            In Vermont:
            <a href="https://www.marcvt.org/" target="_blank">Mt. Ascutney</a>,
            <a href="https://www.trorc.org/" target="_blank">Two Rivers–Ottauquechee</a>,
            and Windham.
          </p>
        </v-sheet>
      </v-col>
    </v-row>

    <!-- === Regions Section === -->
    <v-sheet class="regions-section mx-auto my-8" max-width="1200" rounded>
      <h3 class="section-title">Choose Your Region</h3>
      
      <!-- Missouri -->
      <h4 class="subregion-title">Missouri Regions</h4>
      <v-row class="mt-2 mb-6" justify="center">
        <v-col
          v-for="region in regionsStore.regions.slice(0, 3)"
          :key="region.text"
          cols="12" sm="6" md="4"
          class="d-flex justify-center"
        >
          <v-card class="region-card" elevation="2" @click="handleCardClick(region)">
            <v-img :src="region.image" height="180" cover />
            <v-card-title class="region-card-title">{{ region.title }}</v-card-title>
            <v-card-text class="region-card-text">{{ region.text }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Vermont -->
      <h4 class="subregion-title">Vermont Regions</h4>
      <v-row class="mt-2" justify="center">
        <v-col
          v-for="region in regionsStore.regions.slice(3, 6)"
          :key="region.text"
          cols="12" sm="6" md="4"
          class="d-flex justify-center"
        >
          <v-card class="region-card" elevation="2" @click="handleCardClick(region)">
            <v-img :src="region.image" height="180" cover />
            <v-card-title class="region-card-title">{{ region.title }}</v-card-title>
            <v-card-text class="region-card-text">{{ region.text }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-sheet>

    <!-- === Getting Started Section === -->
    <v-sheet class="getting-started mx-auto" max-width="1200" rounded>
      <h3 class="section-title">How do I get started?</h3>

      <v-row dense>
        <v-col v-for="step in steps" :key="step.id" cols="12" md="6">
          <v-card class="start-card" elevation="1">
            <v-card-title class="start-step-title">{{ step.title }}</v-card-title>
            <v-card-text v-html="step.text"></v-card-text>
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
  router.push({ name: 'maps', query: { region: region.name } })
  regionsStore.currentRegion = region
}

import img1 from '@/assets/Feature1-map-selection.png'
import img2 from '@/assets/Feature2-plots.png'
import img3 from '@/assets/Feature3-flood-maps.png'

const slides = [
  { image: img1, text: 'Easy Site Selection with a tailored map interface that helps you navigate regions.' },
  { image: img2, text: 'Monitor Streamflow through interactive graphs that show historical conditions and forecasts.' },
  { image: img3, text: 'Visualize Flood Scenarios using pre-computed flood maps to assess local impacts.' }
]

const steps = [
  {
    id: 1,
    title: '1. Select Your Region',
    text: `To use the FloodSavvy capabilities described above, please select your local region above or
      visit the <a href="https://floodsavvy.cuahsi.io/#/maps" target="_blank" rel="noopener noreferrer">MAPS</a> page and select your region from the dropdown. This is intended to be used by
      the individuals and organizations affiliated with the six regions in our project, who are
      interested in accessing National Water Model (NWM) information.`
  },
  {
    id: 2,
    title: '2. Using the FloodSavvy Interface',
    text: `For more information on how to use the FloodSavvy interface, including scenarios that 
      demonstrate how FloodSavvy information can be leveraged in different contexts, please 
      visit the FloodSavvy resource page under the <a href="https://floodsavvy.cuahsi.io/#/resources" target="_blank" rel="noopener noreferrer">RESOURCES</a> page.`
  },
  {
    id: 3,
    title: '3. NOAA Resources (NWPS & NWM)',
    text: `If you are not one of the six communities or would like to find out more about official
      NOAA services, including the National Water Prediction Service (NWPS) and the NWM, 
      please visit the National Water Model resource page under the <a href="https://floodsavvy.cuahsi.io/#/resources" target="_blank" rel="noopener noreferrer">RESOURCES</a> page. 
      The tutorial-style resources for the NWPS and NWM are intended to assist all users in navigating, 
      extracting and assessing flood risk insights.`
  },
  {
    id: 4,
    title: '4. About the Project',
    text: `To find out more about the project and how the FloodSavvy resource was co-developed 
      with the six communities, please visit the <a href="https://floodsavvy.cuahsi.io/#/about" target="_blank" rel="noopener noreferrer">ABOUT</a> page.`
  },
  {
    id: 5,
    title: '5. Contact Us',
    text: `If you have any questions or would like to report any issues while using the FloodSavvy 
      website, please visit the <a href="https://floodsavvy.cuahsi.io/#/contact" target="_blank" rel="noopener noreferrer">CONTACT</a> page.`
  }
]

</script>

<style scoped>
/* === Reset minimal === */
p { margin: 0; }
.section-title {
  font-size: 1.6rem;
  margin-bottom: 24px;
  font-weight: 700;
  color: #020202;  
}

/* === Banner === */
.banner {
  --banner-bg: #fff;
  --banner-fg: #125664;
  --banner-title: #0e427d;
  background: var(--banner-bg);
  color: var(--banner-fg);
}
.banner-title {
  font-weight: 800;
  font-size: 1.6rem;
}

/* === Slideshow === */
.slideshow-wrapper {
  overflow: hidden;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 3px 12px rgba(0,0,0,0.1);
}
.slideshow-image {
  border-bottom: 1px solid #ddd;
}
.caption-text {
  color: #0e427d;
  font-weight: 500;
  text-align: center;
}

/* === Regions === */
.regions-section {
  padding: 24px 32px;
  background: #f7fbfc;
  border-left: 5px solid #0e427d;
}
.regions-header {
  color: #0e427d;
  font-weight: 700;
}
.subregion-title {
  font-weight: 700;
  color: #125664;
}
.region-card {
  max-width: 320px;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.2s;
}
.region-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.15);
}

/* === Getting Started === */
.getting-started {
  padding: 32px;
  background: #f5fbfd;
  border-left: 5px solid #0e427d;
  margin-top: 60px;
}
.start-step-title {
  color: #125664;
  font-weight: 700;
}
.start-card {
  background: #fff;
  border-left: 4px solid #dee0e2;
  height: 100%;
}
</style>

<template>
  <v-footer v-if="!$route.meta.hideNavigation" color="navbar">
    <v-row justify="space-around" align="center">
      <v-col v-for="(logo, index) in logos" :key="index" cols="12" sm="4" md="3">
        <v-img
          :src="logo.image"
          :alt="logo.alt"
          :lazy-src="logo.image"
          contain
          height="80"
          class="mx-auto"
          :cover="logo.shouldCover !== false"
        ></v-img>
      </v-col>
    </v-row>
  </v-footer>
</template>

<script setup>
import CIROH from '@/assets/CIROH_black.png'
import CUAHSI from '@/assets/logo.png'
import GRI from '@/assets/GRI_RGB_Monogram_Red+B.png' // Example logo, replace with actual path
const logos = [
  { image: CIROH, alt: 'CIROH', shouldCover: false },
  { image: CUAHSI, alt: 'CUAHSI', shouldCover: false },
  { image: GRI, alt: 'Global Resilience Institute', shouldCover: true }
]
</script>

<style lang="scss" scoped>
.logo {
  height: 100px;
  cursor: pointer;

  img {
    height: 100px;
  }
}
</style>

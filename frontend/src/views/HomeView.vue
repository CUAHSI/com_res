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
      <v-col v-for="region in regions" :key="region.text">
        <v-card class="pa-2" color="secondary" style="height: 400px">
          <v-img
            :src="region.image"
            cover
            :lazy-src="region.image"
            style="max-height: 200px"
          ></v-img>
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

const regions = [
  {
    image: 'https://picsum.photos/600/600?random=1',
    title: 'Location 1',
    text: loremIpsum({ count: 1, units: 'paragraph' }),
    flex: 1
  },
  {
    image: 'https://picsum.photos/600/600?random=2',
    title: 'Location 2',
    text: loremIpsum({ count: 1, units: 'paragraph' }),
    flex: 1
  },
  {
    image: 'https://picsum.photos/600/600?random=3',
    title: 'Location 3',
    text: loremIpsum({ count: 1, units: 'paragraph' }),
    flex: 1
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
</style>

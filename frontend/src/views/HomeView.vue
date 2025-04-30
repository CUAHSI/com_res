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
import roaringRiver from '@/assets/roaring_river.png'

const emit = defineEmits(['region-selected'])
const router = useRouter()

const regions = [
  {
    image: roaringRiver,
    title: 'Roaring River',
    text: loremIpsum({ count: 1, units: 'paragraph' }),
    flex: 1,
    bounds: [
      [36.276939501306224, -454.2379760742188],
      [36.721273880045004, -453.2533264160157]
    ]
  },
  {
    image: 'https://picsum.photos/600/600?random=2',
    title: 'Northeast Region',
    text: loremIpsum({ count: 1, units: 'paragraph' }),
    flex: 1,
    bounds: [
      [42.3601, -71.0589], // northEast (Boston, MA)
      [40.7128, -74.006] // southWest (New York, NY)
    ]
  },
  {
    image: 'https://picsum.photos/600/600?random=3',
    title: 'Florida Region',
    text: loremIpsum({ count: 1, units: 'paragraph' }),
    flex: 1,
    bounds: [
      [27.9944, -81.7603], // northEast (Central Florida)
      [25.7617, -80.1918] // southWest (Miami, FL)
    ]
  }
]
const handleCardClick = (region) => {
  const bounds = region.bounds

  // Emit an event to the parent component with the selected region's bounds
  emit('region-selected', { bounds })

  // Use the router to navigate to the maps view
  router.push({
    name: 'maps',
    query: {
      bounds: JSON.stringify(bounds)
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

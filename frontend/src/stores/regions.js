import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loremIpsum } from 'lorem-ipsum'
import roaringRiver from '@/assets/roaring_river.png'
import deSotoCity from '@/assets/de_soto_city.png'
import { useMapStore } from '@/stores/map'
import { nextTick } from 'vue'

export const useRegionsStore = defineStore('regions', () => {
  const currentRegion = ref(null)
  const regions = ref([
    {
      image: roaringRiver,
      title: 'Roaring River',
      name: 'roaringRiver',
      text: loremIpsum({ count: 1, units: 'paragraph' }),
      flex: 1,
      bounds: [
        [36.30350540784278, -94.43161010742188],
        [36.726227169488475, -93.11874389648438]
      ]
    },
    {
      image: deSotoCity,
      title: 'DeSoto City',
      name: 'deSotoCity',
      text: loremIpsum({ count: 1, units: 'paragraph' }),
      flex: 1,
      bounds: [
        [37.943656003248094, -90.98327636718751],
        [38.35727256417359, -89.67041015625001]
      ]
    },
    {
      image: 'https://picsum.photos/600/600?random=3',
      title: 'Florida Region',
      name: 'floridaRegion',
      text: loremIpsum({ count: 1, units: 'paragraph' }),
      flex: 1,
      bounds: [
        [27.9944, -81.7603], // northEast (Central Florida)
        [25.7617, -80.1918] // southWest (Miami, FL)
      ]
    }
  ])
  const setRegion = async (regionName) => {
    const mapStore = useMapStore()
    const region = regions.value.find((region) => region.name === regionName)
    if (!region) {
      console.error(`Region ${regionName} not found`)
      return
    }
    currentRegion.value = region
    mapStore.toggleWMSLayer(region.name)
    await nextTick()
    mapStore.zoomToBounds(region.bounds)
  }

  return {
    regions,
    currentRegion,
    setRegion
  }
})

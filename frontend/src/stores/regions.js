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
        [36.28081425933677, -94.21875],
        [36.74878811183201, -93.33160400390625]
      ]
    },
    {
      image: deSotoCity,
      title: 'DeSoto City',
      name: 'deSotoCity',
      text: loremIpsum({ count: 1, units: 'paragraph' }),
      flex: 1,
      bounds: [
        [37.921451170095295, -90.9132385253906],
        [38.3793451359944, -90.02609252929689]
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
    mapStore.limitToBounds(region.bounds)
  }

  return {
    regions,
    currentRegion,
    setRegion
  }
})

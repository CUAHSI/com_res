import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loremIpsum } from 'lorem-ipsum'
import RoaringRiverStatePark from '@/assets/RoaringRiverStatePark.png'
import DeSoto from '@/assets/DeSoto.png'
import SpringfieldGreeneCounty from '@/assets/SpringfieldGreeneCounty.png'
import MountAscutney from '@/assets/MountAscutney.png'
import TwoRiversOttauquechee from '@/assets/TwoRiversOttauquechee.png'
import Windham from '@/assets/Windham.png'
import { useMapStore } from '@/stores/map'
import { nextTick } from 'vue'

export const useRegionsStore = defineStore('regions', () => {
  const currentRegion = ref(null)
  const regions = ref([
    {
      image: RoaringRiverStatePark,
      title: 'Roaring River State Park',
      name: 'RoaringRiverStatePark',
      text: loremIpsum({ count: 1, units: 'paragraph' }),
      flex: 1,
      bounds: [
        [36.28081425933677, -94.21875],
        [36.74878811183201, -93.33160400390625]
      ]
    },
    {
      image: DeSoto,
      title: 'DeSoto',
      name: 'DeSoto',
      text: loremIpsum({ count: 1, units: 'paragraph' }),
      flex: 1,
      bounds: [
        [37.921451170095295, -90.9132385253906],
        [38.3793451359944, -90.02609252929689]
      ]
    },
    {
      image: MountAscutney,
      title: 'Mount Ascutney',
      name: 'MountAscutney',
      text: loremIpsum({ count: 1, units: 'paragraph' }),
      flex: 1,
      bounds: [
        [43.158110622265646, -73.86108398437501],
        [43.695679697898825, -71.22436523437501]
      ]
    },
    {
      image: SpringfieldGreeneCounty,
      title: 'Springfield Greene County',
      name: 'SpringfieldGreeneCounty',
      text: loremIpsum({ count: 1, units: 'paragraph' }),
      flex: 1,
      bounds: [
        [37.09407380187568, -93.89739990234376],
        [37.41107339721063, -92.66693115234376]
      ]
    },
    {
      image: TwoRiversOttauquechee,
      title: 'Two Rivers Ottauquechee',
      name: 'TwoRiversOttauquechee',
      text: loremIpsum({ count: 1, units: 'paragraph' }),
      flex: 1,
      bounds: [
        [43.49286979803711, -73.71688842773439],
        [44.067939826463416, -71.25595092773439]
      ]
    },
    {
      image: Windham,
      title: 'Windham',
      name: 'Windham',
      text: loremIpsum({ count: 1, units: 'paragraph' }),
      flex: 1,
      bounds: [
        [42.688659727756516, -73.96682739257814],
        [43.27137193916127, -71.50588989257814]
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
    await nextTick()
    mapStore.toggleWMSLayer(region.name)
    // await nextTick()
    mapStore.limitToBounds(region.bounds)
  }

  /**
   * Calculates the expanded bounds of a specified region with optional padding.
   *
   * @param {string} regionName - The name of the region to retrieve bounds for.
   * @param {number} [padding=1.5] - The multiplier to expand the region bounds. Defaults to 1.5 if not provided.
   * @returns {Array<Array<number>> | null} - The expanded bounds as a 2D array of coordinates
   * [ [minLat, minLng], [maxLat, maxLng] ], or null if the region is not found.
   */
  const getRegionBounds = (regionName, padding) => {
    if (padding === undefined) {
      padding = 1.5 // default padding
    }
    const region = regions.value.find((region) => region.name === regionName)
    if (!region) {
      console.error(`Region ${regionName} not found`)
      return null
    }
    const bounds = region.bounds
    const latDiff = (bounds[1][0] - bounds[0][0]) * padding
    const lngDiff = (bounds[1][1] - bounds[0][1]) * padding
    const newBounds = [
      [bounds[0][0] - latDiff, bounds[0][1] - lngDiff],
      [bounds[1][0] + latDiff, bounds[1][1] + lngDiff]
    ]
    return newBounds
  }

  return {
    regions,
    currentRegion,
    setRegion,
    getRegionBounds
  }
})

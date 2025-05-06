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
        [36.32563675305861, -94.43092346191406],
        [36.74823792383878, -93.11943054199219]
      ]
    },
    {
      image: DeSoto,
      title: 'DeSoto',
      name: 'DeSoto',
      text: loremIpsum({ count: 1, units: 'paragraph' }),
      flex: 1,
      bounds: [
        [37.96260604160774, -91.12541198730469],
        [38.37611542403604, -89.81391906738283]
      ]
    },
    {
      image: MountAscutney,
      title: 'Mount Ascutney',
      name: 'MountAscutney',
      text: loremIpsum({ count: 1, units: 'paragraph' }),
      flex: 1,
      bounds: [
        [43.043801776082425, -73.84735107421876],
        [43.807774213873806, -71.22436523437501]
      ]
    },
    {
      image: SpringfieldGreeneCounty,
      title: 'Springfield Greene County',
      name: 'SpringfieldGreeneCounty',
      text: loremIpsum({ count: 1, units: 'paragraph' }),
      flex: 1,
      bounds: [
        [36.83346996591306, -94.59365844726564],
        [37.67077737288316, -91.97067260742188]
      ]
    },
    {
      image: TwoRiversOttauquechee,
      title: 'Two Rivers Ottauquechee',
      name: 'TwoRiversOttauquechee',
      text: loremIpsum({ count: 1, units: 'paragraph' }),
      flex: 1,
      bounds: [
        [43.02071359427862, -75.10803222656251],
        [44.53959000445632, -69.86206054687501]
      ]
    },
    {
      image: Windham,
      title: 'Windham',
      name: 'Windham',
      text: loremIpsum({ count: 1, units: 'paragraph' }),
      flex: 1,
      bounds: [
        [42.20614200929957, -75.35797119140626],
        [43.74530493763506, -70.11199951171876]
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

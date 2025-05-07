import { defineStore } from 'pinia'
import { ref } from 'vue'
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
      text: `A popular outdoor destination nestled within the rugged terrain of the
             Ozark Plateau’s karst landscape, Roaring River State Park is located
             located eight miles south of Cassville in Barry County, Missouri, 
             spanning 4,294 acres.`,
      flex: 1,
      layers: Array.from({ length: 13 }, (_, i) => i),
      bounds: [
        [36.32563675305861, -94.43092346191406],
        [36.74823792383878, -93.11943054199219]
      ]
    },
    {
      image: DeSoto,
      title: 'DeSoto',
      name: 'DeSoto',
      text: `De Soto is a small city in Jefferson County, Missouri, located about
            45 miles south of St. Louis. The surrounding terrain features rolling 
            hills and a network of creeks and streams that ultimately drain into the Mississippi River.`,
      flex: 1,
      layers: Array.from({ length: 8 }, (_, i) => i),
      bounds: [
        [37.96260604160774, -91.12541198730469],
        [38.37611542403604, -89.81391906738283]
      ]
    },
    {
      image: MountAscutney,
      title: 'Mount Ascutney',
      name: 'MountAscutney',
      text: `This region in southeast‑central Vermont spans ten towns
             and its topography transitions from the
             steep, forested slopes of in the west down through rolling foothills to the
             broad Connecticut River on the east.`,
      flex: 1,
      layers: Array.from({ length: 7 }, (_, i) => i),
      bounds: [
        [43.043801776082425, -73.84735107421876],
        [43.807774213873806, -71.22436523437501]
      ]
    },
    {
      image: SpringfieldGreeneCounty,
      title: 'Springfield Greene County',
      name: 'SpringfieldGreeneCounty',
      text: `The third-largest city in Missouri, located on the Springfield Plateau of the Ozark Mountains 
             where the landscape features a rolling terrain, with some steeper cliffs found on
             the north, east, and south sides of the area.`,
      flex: 1,
      layers: Array.from({ length: 7 }, (_, i) => i),
      bounds: [
        [36.83346996591306, -94.59365844726564],
        [37.67077737288316, -91.97067260742188]
      ]
    },
    {
      image: TwoRiversOttauquechee,
      title: 'Two Rivers Ottauquechee',
      name: 'TwoRiversOttauquechee',
      text: `The Two Rivers‑Ottauquechee region lies in east‑central Vermont, covering 30
             member towns across Windsor and Orange counties. The region is bordered by the Green
             Mountains to the west and the Connecticut River valley to the east.`,
      flex: 1,
      layers: Array.from({ length: 7 }, (_, i) => i),
      bounds: [
        [43.02071359427862, -75.10803222656251],
        [44.53959000445632, -69.86206054687501]
      ]
    },
    {
      image: Windham,
      title: 'Windham',
      name: 'Windham',
      text: `The Windham region is located in southeastern Vermont and includes 27 towns
             The area features a mix of
             rural villages, forested landscapes, and small urban centers that are primarily covered by
             forests, including spruce, fir, and white pine.`,
      flex: 1,
      layers: Array.from({ length: 7 }, (_, i) => i),
      bounds: [
        [42.20614200929957, -75.35797119140626],
        [43.74530493763506, -70.11199951171876]
      ]
    }
  ])
  const setRegion = async (regionName) => {
    console.log('Setting region to:', regionName)
    const mapStore = useMapStore()
    const region = regions.value.find((region) => region.name === regionName)
    if (!region) {
      console.error(`Region ${regionName} not found`)
      return
    }
    currentRegion.value = region
    await nextTick()
    mapStore.toggleWMSLayer(region.name)
    mapStore.toggleFeatureLayer(region.name)
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

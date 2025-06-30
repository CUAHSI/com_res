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
      wmsLayersToLoad: Array.from({ length: 13 }, (_, i) => i),
      flowlinesLayerNumber: 13
    },
    {
      image: DeSoto,
      title: 'DeSoto',
      name: 'DeSoto',
      text: `De Soto is a small city in Jefferson County, Missouri, located about
            45 miles south of St. Louis. The surrounding terrain features rolling 
            hills and a network of creeks and streams that ultimately drain into the Mississippi River.`,
      flex: 1,
      wmsLayersToLoad: Array.from({ length: 8 }, (_, i) => i),
      flowlinesLayerNumber: 0
    },
    {
      image: SpringfieldGreeneCounty,
      title: 'Springfield Greene County',
      name: 'SpringfieldGreeneCounty',
      text: `The third-largest city in Missouri, located on the Springfield Plateau of the Ozark Mountains 
             where the landscape features a rolling terrain, with some steeper cliffs found on
             the north, east, and south sides of the area.`,
      flex: 1,
      wmsLayersToLoad: Array.from({ length: 7 }, (_, i) => i),
      flowlinesLayerNumber: 1
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
      wmsLayersToLoad: Array.from({ length: 7 }, (_, i) => i),
      flowlinesLayerNumber: 0
    },
    {
      image: TwoRiversOttauquechee,
      title: 'Two Rivers Ottauquechee',
      name: 'TwoRiversOttauquechee',
      text: `The Two Rivers‑Ottauquechee region lies in east‑central Vermont, covering 30
             member towns across Windsor and Orange counties. The region is bordered by the Green
             Mountains to the west and the Connecticut River valley to the east.`,
      flex: 1,
      wmsLayersToLoad: Array.from({ length: 7 }, (_, i) => i),
      flowlinesLayerNumber: 0
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
      wmsLayersToLoad: Array.from({ length: 7 }, (_, i) => i),
      flowlinesLayerNumber: 0
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
    mapStore.limitToBounds(region.flowlinesLayer)
    mapStore.toggleWMSLayer(region.name)
    mapStore.toggleFeatureLayer(region.name)
  }

  return {
    regions,
    currentRegion,
    setRegion
  }
})

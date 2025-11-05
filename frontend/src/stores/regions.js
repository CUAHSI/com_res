import { defineStore } from 'pinia'
import { ref } from 'vue'
import RoaringRiver from '@/assets/RoaringRiver.png'
import DeSoto from '@/assets/DeSoto.png'
import SpringfieldGreeneCounty from '@/assets/SpringfieldGreeneCounty.png'
import MountAscutney from '@/assets/MountAscutney.png'
import TwoRiversOttauquechee from '@/assets/TwoRiversOttauquechee.png'
import Windham from '@/assets/Windham.png'
import * as mapHelpers from '@/helpers/map'
import { nextTick } from 'vue'
import { useFeaturesStore } from '@/stores/features'

export const useRegionsStore = defineStore('regions', () => {
  const currentRegion = ref(null)
  const regions = ref([
    {
      image: RoaringRiver,
      title: 'Roaring River State Park',
      name: 'RoaringRiver',
      text: `A popular outdoor destination nestled within the rugged terrain of the
             Ozark Plateau’s karst landscape, Roaring River State Park is located 
             eight miles south of Cassville in Barry County, Missouri, 
             spanning 4,294 acres.`,
      flex: 1,
      flowlinesLayerNumber: 13,
      eraseLayerNumber: 4,
      defaultZoom: 11
    },
    {
      image: DeSoto,
      title: 'DeSoto',
      name: 'DeSoto',
      text: `De Soto is a small city in Jefferson County, Missouri, located about
            45 miles south of St. Louis. The surrounding terrain features rolling 
            hills and a network of creeks and streams that ultimately drain into the Mississippi River.`,
      flex: 1,
      flowlinesLayerNumber: 0,
      eraseLayerNumber: 3,
      defaultZoom: 11
    },
    {
      image: SpringfieldGreeneCounty,
      title: 'Springfield Greene County',
      name: 'SpringfieldGreeneCounty',
      text: `The third-largest city in Missouri, located on the Springfield Plateau of the Ozark Mountains 
             where the landscape features a rolling terrain, with some steeper cliffs found on
             the north, east, and south sides of the area.`,
      flex: 1,
      flowlinesLayerNumber: 1,
      eraseLayerNumber: 2,
      defaultZoom: 10
    },
    {
      image: MountAscutney,
      title: 'Mount Ascutney',
      name: 'MountAscutney',
      text: `The region in southeast-central Vermont covers ten towns, with terrain that shifts 
            from steep, forested slopes in the west to rolling foothills and the broad Connecticut 
            River valley in the east.`,
      flex: 1,
      flowlinesLayerNumber: 0,
      eraseLayerNumber: 1,
      defaultZoom: 10
    },
    {
      image: TwoRiversOttauquechee,
      title: 'Two Rivers Ottauquechee',
      name: 'TwoRiversOttauquechee',
      text: `The Two Rivers‑Ottauquechee region lies in east‑central Vermont, covering 30
             member towns across Windsor and Orange counties. The region is bordered by the Green
             Mountains to the west and the Connecticut River valley to the east.`,
      flex: 1,
      flowlinesLayerNumber: 0,
      eraseLayerNumber: 3,
      defaultZoom: 10
    },
    {
      image: Windham,
      title: 'Windham',
      name: 'Windham',
      text: `The Windham region is located in southeastern Vermont and includes 27 towns.
             The area features a mix of
             rural villages, forested landscapes, and small urban centers that are primarily covered by
             forests, including spruce, fir, and white pine.`,
      flex: 1,
      flowlinesLayerNumber: 0,
      eraseLayerNumber: 3,
      defaultZoom: 10
    }
  ])
  const setRegion = async (regionName) => {
    const featureStore = useFeaturesStore()
    console.log('Setting region to:', regionName)
    const region = regions.value.find((region) => region.name === regionName)
    if (!region) {
      console.error(`Region ${regionName} not found`)
      return
    }
    currentRegion.value = region

    // clear the active feature if there is one selected
    featureStore.clearSelectedFeatures()

    await mapHelpers.toggleWMSLayers(region)
    try {
      await mapHelpers.toggleFeatureLayer(region)
    } catch (error) {
      console.error('Error toggling feature layer:', error)
    }
    mapHelpers.limitToBounds(region)
  }

  return {
    regions,
    currentRegion,
    setRegion
  }
})

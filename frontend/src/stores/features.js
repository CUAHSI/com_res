import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as mapHelpers from '@/helpers/map'

export const useFeaturesStore = defineStore(
  'features',
  () => {
    const selectedFeatures = ref([])
    const activeFeature = ref(null)
    const querying = ref({ hydrocron: false, nodes: false })

    // define activeFeatureName as a computer property so that
    // it updates automatically when activeFeature changes
    const activeFeatureName = computed(() => {
      if (!activeFeature.value) return ''

      const river_name = activeFeature.value.properties.PopupTitle
      if (river_name === 'NODATA') {
        return 'UNNAMED RIVER'
      }
      console.log('Computing activeFeatureName:', river_name)
      console.log(activeFeature.value.properties)
      return river_name
    })

    function selectFeature(feature) {
      console.log('Selecting feature', feature)
      clearSelectedFeatures()
      mapHelpers.selectFeature(feature)
      selectedFeatures.value.push(feature)
      activeFeature.value = feature
    }

    function deselectFeature(feature) {
      mapHelpers.deselectFeature(feature)
      selectedFeatures.value = selectedFeatures.value.filter((f) => f.id !== feature.id)
      if (activeFeature.value.id === feature.id) {
        activeFeature.value = null
      }
    }

    function mergeFeature(feature) {
      console.log('Merging feature', feature)
      const index = selectedFeatures.value.findIndex((f) => f.id === feature.id)
      if (index !== -1) {
        console.log('Feature already exists in selected features')
        selectedFeatures.value[index] = feature
      } else {
        console.log('Feature does not exist in selected features')
        selectedFeatures.value.push(feature)
      }
      activeFeature.value = feature
      mapHelpers.selectFeature(feature)
    }

    const clearSelectedFeatures = () => {
      for (const feature of selectedFeatures.value) {
        mapHelpers.deselectFeature(feature)
      }
      selectedFeatures.value = []
      activeFeature.value = null
      mapHelpers.clearAllFeatures()
    }

    const checkFeatureSelected = (feature) => {
      return selectedFeatures.value.some((f) => f.id === feature.id)
    }

    return {
      selectedFeatures,
      selectFeature,
      activeFeature,
      activeFeatureName,
      clearSelectedFeatures,
      deselectFeature,
      checkFeatureSelected,
      mergeFeature,
      querying
    }
  },
  {
    // persist: {
    //   // persist the timeRange
    //   // https://prazdevs.github.io/pinia-plugin-persistedstate/guide/config.html#pick
    //   pick: ['timeRange'],
    // }
  }
)

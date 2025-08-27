import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as mapHelpers from '@/helpers/map'

export const useFeaturesStore = defineStore(
  'features',
  () => {
    const selectedFeatures = ref([])
    const activeFeature = ref(null)
    const querying = ref({ hydrocron: false, nodes: false })


    function selectFeature(feature) {
      console.log('Selecting feature', feature)
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

    const getFeatureName = (feature = null) => {
      if (feature == null) {
        feature = activeFeature.value
      }
      if (!feature) return ''
      const river_name = feature.properties.river_name
      if (river_name === 'NODATA') {
        return 'UNNAMED RIVER'
      }
      return river_name
    }

    return {
      selectedFeatures,
      selectFeature,
      activeFeature,
      clearSelectedFeatures,
      deselectFeature,
      checkFeatureSelected,
      mergeFeature,
      getFeatureName,
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

import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

export const useMapStore = defineStore('map', () => {
  const leaflet = shallowRef(null)
  const mapObject = ref(new Map())
  const featureOptions = ref({
    selectedColor: 'red',
    defaultColor: 'blue',
    defaultWeight: 2,
    selectedWeight: 5,
    opacity: 0.7
  })
  const mapLoaded = ref(false)

  const deselectFeature = (feature) => {
    try {
      mapObject.value.flowlinesFeatures.setFeatureStyle(feature.id, {
        color: featureOptions.value.defaultColor,
        weight: featureOptions.value.defaultWeight
      })
    } catch (error) {
      console.warn('Attempted to deselect feature:', error)
    }
  }

  const selectFeature = (feature) => {
    try {
      mapObject.value.flowlinesFeatures.setFeatureStyle(feature.id, {
        color: featureOptions.value.selectedColor,
        weight: featureOptions.value.selectedWeight
      })
    } catch (error) {
      console.warn('Attempted to select feature:', error)
    }
  }

  const clearAllFeatures = () => {
    mapObject.value.flowlinesFeatures.eachFeature(function (feature) {
      feature.setStyle({ color: featureOptions.value.defaultColor })
    })
  }

  const zoomToBounds = (bounds) => {
    if (bounds) {
      const parsedBounds = JSON.parse(bounds)
      try {
        console.log(`Zooming to bounds: ${parsedBounds}`)
        leaflet.value.fitBounds(parsedBounds)
        // prevent panning from bounds
        leaflet.value.setMaxBounds(parsedBounds)
        // prevent zooming out
        leaflet.value.setMinZoom(leaflet.value.getZoom())
      } catch (error) {
        console.warn('Error parsing bounds:', error)
      }
    } else {
      alert('No bounds provided')
    }
  }

  return {
    mapObject,
    mapLoaded,
    deselectFeature,
    selectFeature,
    clearAllFeatures,
    zoomToBounds,
    featureOptions,
    leaflet
  }
})

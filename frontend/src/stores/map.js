import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

export const useMapStore = defineStore('map', () => {
  const leaflet = shallowRef(null)
  const wmsLayers = ref([])
  const mapObject = ref(new Map())
  const flowlinesFeatureLayers = ref([])
  const activeFeatureLayer = shallowRef(null)
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
      activeFeatureLayer.value.setFeatureStyle(feature.id, {
        color: featureOptions.value.defaultColor,
        weight: featureOptions.value.defaultWeight
      })
    } catch (error) {
      console.warn('Attempted to deselect feature:', error)
    }
  }

  const selectFeature = (feature) => {
    try {
      activeFeatureLayer.value.setFeatureStyle(feature.id, {
        color: featureOptions.value.selectedColor,
        weight: featureOptions.value.selectedWeight
      })
    } catch (error) {
      console.warn('Attempted to select feature:', error)
    }
  }

  const clearAllFeatures = () => {
    try {
      activeFeatureLayer.value.eachFeature(function (feature) {
        feature.setStyle({ color: featureOptions.value.defaultColor })
      })
    } catch (error) {
      console.warn('Attempted to clear all features:', error)
    }
  }

  const limitToBounds = (featureLayer) => {
    console.log('Limiting to bounds of feature layer:', featureLayer)
    const bounds = featureLayer.bounds
    if (bounds) {
      try {
        console.log(`Zooming to bounds: ${bounds}`)
        leaflet.value.fitBounds(bounds)
        // prevent panning from bounds
        leaflet.value.setMaxBounds(bounds)
        // prevent zooming out
        leaflet.value.setMinZoom(leaflet.value.getZoom())
      } catch (error) {
        console.warn('Error parsing bounds:', error)
      }
    } else {
      alert('No bounds provided')
    }
  }

  const toggleWMSLayer = (layerName) => {
    // turn off all other wms layers and turn on the selected one
    wmsLayers.value.forEach((wmsLayer) => {
      if (wmsLayer.name !== layerName) {
        wmsLayer.removeFrom(leaflet.value)
      } else {
        wmsLayer.addTo(leaflet.value)
      }
    })
  }

  const toggleFeatureLayer = (layerName) => {
    // turn off all other feature layers and turn on the selected one
    console.log('Toggling feature layer:', layerName)
    flowlinesFeatureLayers.value.forEach((featureLayer) => {
      if (featureLayer.name !== layerName) {
        featureLayer.removeFrom(leaflet.value)
      } else {
        featureLayer.addTo(leaflet.value)
        activeFeatureLayer.value = featureLayer
      }
    })
  }

  return {
    mapObject,
    mapLoaded,
    deselectFeature,
    selectFeature,
    clearAllFeatures,
    limitToBounds,
    featureOptions,
    leaflet,
    wmsLayers,
    flowlinesFeatureLayers,
    activeFeatureLayer,
    toggleWMSLayer,
    toggleFeatureLayer
  }
})

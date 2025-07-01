import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import L from 'leaflet'

export const useMapStore = defineStore('map', () => {
  const leaflet = shallowRef(null)
  const wmsLayers = ref({})
  const mapObject = ref(new Map())
  const flowlinesFeatureLayers = ref([])
  const featureLayerProviders = shallowRef([])
  const activeFeatureLayer = shallowRef(null)
  const control = shallowRef(null)
  const featureOptions = ref({
    selectedColor: 'red',
    defaultColor: 'blue',
    defaultWeight: 2,
    selectedWeight: 5,
    opacity: 0.7
  })
  const mapLoaded = ref(false)

  const MIN_WMS_ZOOM = 9
  const COMRES_SERVICE_URL = 'https://arcgis.cuahsi.org/arcgis/services/CIROH-ComRes'
  const COMRES_REST_URL = 'https://arcgis.cuahsi.org/arcgis/rest/services/CIROH-ComRes'

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
    featureLayer.query().bounds(function (error, bounds) {
      if (error) {
        console.log('Error running bounds query:')
        console.warn(error)
      }
      try {
        console.log(`Zooming to bounds: ${bounds}`)
        leaflet.value.fitBounds(bounds)
        // prevent panning from bounds
        leaflet.value.setMaxBounds(bounds)
        // prevent zooming out
        leaflet.value.setMinZoom(leaflet.value.getZoom())
      } catch (error) {
        console.warn('Error zooming to bounds:', error)
      }
    })
  }

  async function createWMSLayers(region) {
    // first check if the wms layer already exists for this region
    if (
      wmsLayers.value[region.name] &&
      wmsLayers.value[region.name].some((layer) => layer.name.includes(region.name))
    ) {
      console.log(`WMS layers for ${region.name} already exist, skipping creation.`)
      return
    }
    let url = `${COMRES_REST_URL}/${region.name}/MapServer`
    // first query the service just to get the layer names
    const queryUrl = `${url}/layers?f=json`
    const response = await fetch(queryUrl)
    const data = await response.json()
    if (data && data.layers) {
      console.log(`Creating WMS Layers for ${region.name}:`)
      data.layers.forEach((layer) => {
        console.log(`Creating layer ${layer.id}: ${layer.name}...`)
        url = `${COMRES_SERVICE_URL}/${region.name}/MapServer/WmsServer?`
        // https://leafletjs.com/reference.html#tilelayer-wms
        const wmsLayer = L.tileLayer.wms(url, {
          // TODO: seems like this id might be off by one...
          layers: `${layer.id}`,
          // layers: index + 1,
          // layers: layer.id + 1, // ArcGIS REST API layers are 1-indexed
          // layers: [layer.id],
          transparent: true,
          // TODO: set the transparency...
          opacity: layer.id === region.eraseLayerNumber ? 0.5 : 1,
          // opacity: layer.name.toLowerCase().includes('erase') ? 0.5 : 1,
          format: 'image/png',
          minZoom: MIN_WMS_ZOOM
        })
        wmsLayer.name = `${layer.name} - ${region.name} - ${layer.id}`
        wmsLayer.id = layer.id
        wmsLayers.value[region.name] = wmsLayers.value[region.name] || []
        wmsLayers.value[region.name].push(wmsLayer)
      })
      console.log('WMS Layers thus far:', wmsLayers.value)
    } else {
      console.error(`No layers found for ${region.name}`)
    }
  }

  async function addWMSLayers(region) {
    // await createWMSLayers(region)
    for (let layer of wmsLayers.value[region.name] || []) {
      // only add layers that are part of the current region
      if (!layer.name.includes(region.name)) {
        console.log(`Skipping layer ${layer.name} for region ${region.name}`)
        continue
      }
      console.log('Adding WMS layer:', layer.name)
      layer.addTo(leaflet.value)
      control.value.addOverlay(layer, layer.name)
    }
  }

  const toggleWMSLayers = (region) => {
    // if the regionName is not in wmsLayers, create it
    if (!wmsLayers.value[region.name]) {
      console.log(`Creating WMS layers for region: ${region.name}`)
      createWMSLayers(region)
        .then(() => {
          console.log(`WMS layers created for region: ${region.name}`)
          addWMSLayers(region)
        })
        .catch((error) => {
          console.error(`Error creating WMS layers for region ${region.name}:`, error)
        })
    }
    // turn off wms layers that are not part of the current region
    Object.keys(wmsLayers.value).forEach((regionName) => {
      if (regionName !== region.name) {
        console.log(`Removing WMS layers for region: ${regionName}`)
        wmsLayers.value[regionName].forEach((wmsLayer) => {
          wmsLayer.removeFrom(leaflet.value)
          control.value.removeLayer(wmsLayer)
        })
      }
    })
  }

  const toggleFeatureLayer = (layerName) => {
    // turn off all other feature layers and turn on the selected one
    console.log('Toggling feature layer:', layerName)
    flowlinesFeatureLayers.value.forEach((featureLayer) => {
      if (featureLayer.name !== layerName) {
        featureLayer.removeFrom(leaflet.value)
        control.value.removeLayer(featureLayer)
      } else {
        featureLayer.addTo(leaflet.value)
        activeFeatureLayer.value = featureLayer
        control.value.addOverlay(featureLayer, `Flowlines features - ${featureLayer.name}`)
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
    featureLayerProviders,
    activeFeatureLayer,
    toggleWMSLayers,
    toggleFeatureLayer,
    control
  }
})

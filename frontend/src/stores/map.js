import { defineStore } from 'pinia'
import { nextTick, ref, shallowRef } from 'vue'
import L, { canvas } from 'leaflet'
import * as esriLeaflet from 'esri-leaflet'
import * as esriLeafletGeocoder from 'esri-leaflet-geocoder'
import { useFeaturesStore } from '@/stores/features'

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
  const MIN_WFS_ZOOM = 9
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
    featureLayer.query().bounds(async function (error, bounds) {
      if (error) {
        console.log('Error running bounds query:')
        console.warn(error)
      }
      try {
        console.log('Setting bounds to:', bounds)
        leaflet.value.setMaxBounds(null)
        leaflet.value.setView([0, 0], 2)
        leaflet.value.invalidateSize()

        // prevent panning from bounds
        leaflet.value.setMaxBounds(bounds)
        leaflet.value.fitBounds(bounds)
        await nextTick()
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
      console.log(`Creating WMS Layers for ${region.name}`)
      data.layers.forEach((layer) => {
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
    } else {
      console.error(`No layers found for ${region.name}`)
    }
  }

  async function addWMSLayers(region) {
    for (let layer of wmsLayers.value[region.name] || []) {
      // only add layers that are part of the current region
      if (!layer.name.includes(region.name)) {
        console.warn(`Skipping layer ${layer.name} for region ${region.name}`)
        continue
      }
      layer.addTo(leaflet.value)
      control.value.addOverlay(layer, layer.name)
    }
  }

  const toggleWMSLayers = (region) => {
    // if the regionName is not in wmsLayers, create it
    if (!wmsLayers.value[region.name]) {
      createWMSLayers(region)
        .then(() => {
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

  function createFlowlinesFeatureLayer(region) {
    const featureStore = useFeaturesStore()
    let url = `https://arcgis.cuahsi.org/arcgis/rest/services/CIROH-ComRes/${region.name}/FeatureServer/${region.flowlinesLayerNumber}`
    const featureLayer = esriLeaflet.featureLayer({
      url: url,
      simplifyFactor: 0.4,
      precision: 5,
      minZoom: MIN_WFS_ZOOM,
      renderer: canvas({ tolerance: 5 }),
      color: featureOptions.value.defaultColor,
      weight: featureOptions.value.defaultWeight,
      opacity: featureOptions.value.opacity,
      fields: [
        'FID',
        'COMID',
        'REACHCODE',
        'PopupTitle',
        'PopupSubti',
        'SLOPE',
        'LENGTHKM',
        'Hydroseq',
        'GNIS_ID'
      ]
    })
    featureLayer.name = region.name

    featureLayer.on('click', function (e) {
      const feature = e.layer.feature
      const properties = feature.properties
      console.log('Feature clicked:', feature)
      featureStore.clearSelectedFeatures()
      if (!featureStore.checkFeatureSelected(feature)) {
        // Only allow one feature to be selected at a time
        featureStore.selectFeature(feature)
      }
      const popup = L.popup()
      const content = `
        ${properties.PopupTitle ? `<h3>${properties.PopupTitle}</h3>` : ''}
        ${properties.PopupSubti ? `<h4>${properties.PopupSubti}</h4>` : ''}
        <p>
            <ul>
          ${properties.REACHCODE ? `<li>Reach Code: ${properties.REACHCODE}</li>` : ''}
          ${properties.COMID ? `<li>COMID: ${properties.COMID}</li>` : ''}
          ${properties.Hydroseq ? `<li>Hydroseq: ${properties.Hydroseq}</li>` : ''}
          ${properties.SLOPE ? `<li>Slope: ${properties.SLOPE.toFixed(4)}</li>` : ''}
          ${properties.LENGTHKM ? `<li>Length: ${properties.LENGTHKM.toFixed(4)} km</li>` : ''}
          ${properties.GNIS_ID ? `<li>GNIS ID: ${properties.GNIS_ID}</li>` : ''}
            </ul>
        </p>
        `
      popup.setLatLng(e.latlng).setContent(content).openOn(leaflet.value)
    })
    return featureLayer
  }

  function createFeatureLayerProvider(region) {
    let url = `https://arcgis.cuahsi.org/arcgis/rest/services/CIROH-ComRes/${region.name}/FeatureServer/${region.flowlinesLayerNumber}`
    const featureLayerProvider = esriLeafletGeocoder.featureLayerProvider({
      url: url,
      searchFields: ['PopupTitle'],
      label: `${region.name} Flowlines`,
      //bufferRadius: 5000,
      formatSuggestion: function (feature) {
        return feature.properties.PopupTitle
      }
    })
    return featureLayerProvider
  }

  const toggleFeatureLayer = async (region) => {
    // first check if the region is already added
    if (!flowlinesFeatureLayers.value.some((layer) => layer.name === region.name)) {
      console.log(`Adding feature layer for region: ${region.name}`)
      const flowlines = createFlowlinesFeatureLayer(region)
      flowlinesFeatureLayers.value.push(flowlines)
      const provider = createFeatureLayerProvider(region)
      featureLayerProviders.value.push(provider)
      region.flowlinesLayer = flowlines
    }
    // turn off all other feature layers and turn on the selected one
    console.log('Toggling feature layer:', region.name)
    flowlinesFeatureLayers.value.forEach((featureLayer) => {
      if (featureLayer.name !== region.name) {
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

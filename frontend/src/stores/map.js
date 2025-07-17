import { defineStore } from 'pinia'
import { nextTick, ref, shallowRef } from 'vue'
import L, { canvas } from 'leaflet'
import * as esriLeaflet from 'esri-leaflet'
import * as esriLeafletGeocoder from 'esri-leaflet-geocoder'
import { useFeaturesStore } from '@/stores/features'
import { useAlertStore } from '@/stores/alerts'
import { ENDPOINTS } from '@/constants'
import GeoRasterLayer from 'georaster-layer-for-leaflet'
import parseGeoraster from 'georaster'

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
  const stageValue = ref(5) // Default stage value for the slider

  const MIN_WMS_ZOOM = 9
  const MIN_WFS_ZOOM = 9
  const COMRES_REST_URL = 'https://arcgis.cuahsi.org/arcgis/rest/services/CIROH-ComRes'

  const erroredLayers = ref(new Set()) // Track broken WMS layers

  // A simple helper function to debounce calls.
  // It ensures a function is not called again until a certain amount of time has passed without it being called.
  function debounce(func, timeout = 250) {
    let timer
    return (...args) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        func.apply(this, args)
      }, timeout)
    }
  }

  // --- START: NEW CRASH-HANDLING LOGIC ---
  let mapCorrupted = false

  function patchZoomAnimationCrashHandler() {
    if (!leaflet.value || !leaflet.value._animateZoom) return
    const originalAnimateZoom = leaflet.value._animateZoom
    leaflet.value._animateZoom = function (...args) {
      try {
        return originalAnimateZoom.apply(this, args)
      } catch (e) {
        if (e.message && e.message.includes('getZoomScale')) {
          console.error('Leaflet zoom animation crashed — repairing map...', e)
          if (!mapCorrupted) {
            mapCorrupted = true
            repairCorruptedMap()
          }
        } else {
          throw e
        }
      }
    }
  }

  function repairCorruptedMap() {
    if (!leaflet.value) return
    console.warn('Resetting Leaflet map due to animation crash...')

    const center = leaflet.value.getCenter()
    const zoom = leaflet.value.getZoom()
    const preservedLayers = []

    leaflet.value.eachLayer((layer) => {
      // Preserve all layers except the base tile layers, which we'll recreate.
      if (!layer.options.attribution || !layer.options.attribution.includes('CARTO')) {
        preservedLayers.push(layer)
      }
    })

    leaflet.value.off()
    leaflet.value.remove()

    const oldEl = document.getElementById('mapContainer') // Use your actual map ID
    if (oldEl && oldEl.parentNode) {
      const newEl = oldEl.cloneNode(false)
      oldEl.parentNode.replaceChild(newEl, oldEl)
    }

    setTimeout(() => {
      // Re-run the entire initialization logic, which will create a fresh map
      initializeMap('mapContainer', center, zoom)

      // Re-add all the dynamic layers that were on the map before the crash
      preservedLayers.forEach((layer) => {
        if (!leaflet.value.hasLayer(layer)) {
          leaflet.value.addLayer(layer)
        }
      })

      // Re-add layers to the control
      if (control.value) {
        preservedLayers.forEach((layer) => {
          if (layer.name) {
            // Assuming your overlay layers have a 'name' property
            control.value.addOverlay(layer, layer.name)
          }
        })
      }

      mapCorrupted = false
      console.log('Map successfully repaired.')
    }, 100)
  }
  // --- END: NEW CRASH-HANDLING LOGIC ---

  // This function now contains all the setup logic moved from TheLeafletMap.vue
  function initializeMap(elementId, center = [38.2, -96], zoom = 5) {
    leaflet.value = L.map(elementId).setView(center, zoom)

    // --- This block is moved directly from your component's onMounted ---
    mapObject.value.hucbounds = []
    mapObject.value.popups = []
    mapObject.value.buffer = 20
    mapObject.value.huclayers = []
    mapObject.value.reaches = {}
    mapObject.value.bbox = [99999999, 99999999, -99999999, -99999999]
    leaflet.value.zoomControl.remove()

    const MIN_REACH_SELECTION_ZOOM = 11
    const ACCESS_TOKEN =
      'AAPK7e5916c7ccc04c6aa3a1d0f0d85f8c3brwA96qnn6jQdX3MT1dt_4x1VNVoN8ogd38G2LGBLLYaXk7cZ3YzE_lcY-evhoeGX'

    let Esri_Hydro_Reference_Overlay = esriLeaflet.tiledMapLayer({
      url: 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Esri_Hydro_Reference_Overlay/MapServer',
      maxZoom: MIN_REACH_SELECTION_ZOOM,
      minZoom: 0
    })

    let CartoDB_PositronNoLabels = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
      {
        noWrap: true,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }
    )

    let Esri_WorldImagery = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      {
        noWrap: true,
        variant: 'World_Imagery',
        attribution: 'Esri',
        maxZoom: 18,
        minZoom: 0
      }
    )

    let USGS_Imagery = L.tileLayer(
      'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'USGS',
        noWrap: true,
        maxZoom: 18,
        minZoom: 0
      }
    )

    const baselayers = {
      'ESRI World Imagery': Esri_WorldImagery,
      'CartoDB Positron No Labels': CartoDB_PositronNoLabels,
      'USGS Imagery': USGS_Imagery
    }

    let flowlines = L.tileLayer.wms(
      'https://maps.water.noaa.gov/server/services/reference/static_nwm_flowlines/MapServer/WMSServer',
      {
        layers: 0,
        transparent: 'true',
        format: 'image/png',
        minZoom: 8,
        maxZoom: MIN_REACH_SELECTION_ZOOM
      }
    )

    Esri_WorldImagery.addTo(leaflet.value)
    Esri_Hydro_Reference_Overlay.addTo(leaflet.value)

    let mixed = {
      'ESRI Hydro Reference Overlay': Esri_Hydro_Reference_Overlay,
      'Flowlines WMS': flowlines
    }

    const addressSearchProvider = esriLeafletGeocoder.arcgisOnlineProvider({
      apikey: ACCESS_TOKEN,
      maxResults: 3
    })

    const providers = [addressSearchProvider, ...featureLayerProviders.value]

    control.value = L.control.layers(baselayers, mixed).addTo(leaflet.value)

    esriLeafletGeocoder
      .geosearch({
        position: 'topright',
        placeholder: 'Search for a location',
        useMapBounds: true,
        expanded: false,
        title: ' Search',
        providers: providers
      })
      .addTo(leaflet.value)

    L.control.zoom({ position: 'topleft' }).addTo(leaflet.value)

    // This will wait 250ms after the LAST zoom event before running.
    const debouncedUpdate = debounce(() => updateVisibleWMSLayers(), 350)

    // Add event listener that calls the debounced function
    leaflet.value.on('zoomend', debouncedUpdate)

    mapLoaded.value = true

    // IMPORTANT: Patch the new map instance to handle future crashes.
    patchZoomAnimationCrashHandler()

    console.log('Map initialized and patched.')
  }
  // --- END: NEW INITIALIZATION FUNCTION ---

  // --- START: MOVED FUNCTION ---
  // This function was moved from TheLeafletMap.vue
  function updateVisibleWMSLayers() {
    if (!leaflet.value) return
    console.log('Updating visible WMS layers at zoom level', leaflet.value.getZoom())
    const zoom = leaflet.value.getZoom()

    Object.keys(wmsLayers.value).forEach((region) => {
      for (const layer of wmsLayers.value[region]) {
        if (zoom < layer.options.minZoom || zoom > layer.options.maxZoom) {
          if (leaflet.value.hasLayer(layer)) leaflet.value.removeLayer(layer)
        } else {
          if (!leaflet.value.hasLayer(layer)) leaflet.value.addLayer(layer)
        }
      }
    })
  }
  // --- END: MOVED FUNCTION ---

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

  const selectFeature = async (feature) => {
    const alertStore = useAlertStore()
    try {
      activeFeatureLayer.value.setFeatureStyle(feature.id, {
        color: featureOptions.value.selectedColor,
        weight: featureOptions.value.selectedWeight
      })
      let fimCogData = null
      // check if the feature already has FIM COG data
      if (feature.properties?.fimCogData) {
        console.log('Feature already has FIM COG data:', feature.properties.fimCogData)
        fimCogData = feature.properties.fimCogData
      } else {
        console.log('Feature does not have FIM COG data, fetching...')
        // query FastAPI to get relevant geotiffs for the reach
        fimCogData = await fetchCogCatalogData(feature)
        saveCatalogDataToFeature(feature, fimCogData)
      }
      //      console.log('FIM COG DATA:', fimCogData)
      // fimCogData is now an object containing 3 arrays: files, flows_cms, and stages_m
      const cogUrls = determineCogsForStage(fimCogData.files, fimCogData.stages_m)
      if (cogUrls.length === 0) {
        alertStore.displayAlert({
          title: 'Stage Selection',
          text: `No COGs found for reach: ${feature.properties?.reach_id || feature.properties?.COMID} with selected stage: ${stageValue.value}m.`,
          type: 'warning',
          closable: true,
          duration: 3
        })
        return
      }
      // // zoom into the bounds of the feature
      // const bounds = L.geoJSON(feature).getBounds()
      // leaflet.value.fitBounds(bounds)
      //
      console.log(cogUrls)
      addCogsToMap(cogUrls)
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

  const fetchCogCatalogData = async (feature) => {
    // Query FastAPI to get stage, flow, and TIFF urls for a given feature
    try {
      console.log('Fetching FIM COGs for feature:', feature)
      const reachId = feature?.properties?.COMID || feature?.properties?.reach_id
      if (!reachId) {
        console.warn('No reach_id found in feature properties:', feature)
        return
      }
      const params = new URLSearchParams({
        reach_id: reachId
      })
      console.log(`Querying for FIM COGs matching reach_id: ${reachId}`)
      const response = await fetch(`${ENDPOINTS.fim}?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching FIM COGs:', error)
    }
  }

  const saveCatalogDataToFeature = (feature, fimCogData) => {
    // Save the fetched FIM COG data to the feature properties
    if (!feature.properties) {
      feature.properties = {}
    }
    feature.properties.fimCogData = fimCogData
    console.log('Saved FIM COG data to feature properties:', fimCogData)
  }

  /**
   * Determines and returns the COGs (Cloud Optimized GeoTIFF URLs) that correspond to a specific stage value.
   *
   * @param {Array<string|Array>} cogs - An array of COG URLs or arrays of COG URLs.
   * @param {Array<string>} stage - An array of stage values, sorted in order.
   * @returns {Array<string|Array>} An array of COGs that match the current stage value. Returns an empty array if no match is found.
   *
   * @example
   * // Given cogs = ['url1', 'url2', ['url3', 'url4']]
   * // and stage = ['stage1', 'stage2', 'stage3']
   * // If stageValue.value is 'stage2', returns ['url2']
   *
   * @throws {void} Does not throw, but logs warnings if the stage value is not found or no COGs match.
   */
  const determineCogsForStage = (cogs, stage) => {
    const index = stage.findIndex((s) => s === stageValue.value)
    if (index === -1) {
      console.warn(`Stage value ${stageValue.value} not found in stage array`)
      return []
    }
    // Return the COGs that match the index
    const matchingCogs = cogs.filter(
      (cog, i) => i === index || (Array.isArray(cog) && cog.includes(stageValue.value))
    )
    if (matchingCogs.length === 0) {
      console.warn(`No COGs found for stage value ${stageValue.value}`)
      return []
    }
    console.log(`Found ${matchingCogs.length} COGs for stage value ${stageValue.value}`)
    return matchingCogs
  }

  /**
   * Adds Cloud Optimized GeoTIFFs (COGs) as GeoRasterLayers to a Leaflet map.
   *
   * Fetches each COG URL, parses it into a georaster object, and creates a GeoRasterLayer
   * with custom color mapping for pixel values. The layer is then added to the Leaflet map.
   *
   * @param {string[]} cogs - An array of URLs pointing to Cloud Optimized GeoTIFF files.
   *
   * @returns {void}
   */
  const addCogsToMap = (cogs) => {
    const alertStore = useAlertStore()
    console.log('Adding COGs to map:', cogs)
    try {
      for (let cog of cogs) {
        fetch(cog)
          .then((res) => res.arrayBuffer())
          .then((arrayBuffer) => {
            parseGeoraster(arrayBuffer).then((georaster) => {
              /*
              GeoRasterLayer is an extension of GridLayer,
              which means we can use GridLayer options like opacity.
              http://leafletjs.com/reference-1.2.0.html#gridlayer
            */
              const raster = new GeoRasterLayer({
                attribution: 'CUAHSI',
                georaster: georaster,
                resolution: 128,
                opacity: 0.5,
                pixelValuesToColorFn: (pixelValues) => {
                  // Assuming pixelValues is an array of values, map them to colors
                  return pixelValues.map((value) => {
                    // Example: Map value to a color based on some condition
                    if (value > 0) {
                      return 'blue' // Color for inundated areas
                    } else {
                      return 'transparent' // Color for non-inundated areas
                    }
                  })
                },
                bandIndex: 0, // Assuming the raster has a single band
                noDataValue: 0 // Assuming 0 is the no-data value
              })
              raster.addTo(leaflet.value)
              // leaflet.value.fitBounds(raster.getBounds())
              console.log(`Added GeoRasterLayer for ${cog}`)
            })
          })
          .catch((error) => {
            console.error('Error fetching or parsing GeoTIFF:', error)
            alertStore.displayAlert({
              title: 'Error Loading COG',
              text: 'There was an error loading the selected COG.',
              type: 'error',
              closable: true,
              duration: 5
            })
          })
      }
    } catch (error) {
      console.error('Error loading GeoRasterLayer:', error)
    }
  }

  const clearCogsFromMap = () => {
    console.log('Clearing all COGs from map')
    leaflet.value.eachLayer((layer) => {
      if (layer instanceof GeoRasterLayer) {
        console.log('Removing GeoRasterLayer:', layer)
        leaflet.value.removeLayer(layer)
      }
    })
  }

  const limitToBounds = (region) => {
    console.log('Limiting to bounds of region', region)
    region.flowlinesLayer.query().bounds(async function (error, bounds) {
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
        // instead of fitbounds, use default zoom
        // leaflet.value.fitBounds(bounds)
        leaflet.value.setView(bounds.getCenter(), region.defaultZoom || 10)
        const zoom = leaflet.value.getZoom()
        console.log('Current zoom level:', zoom)
        await nextTick()
        // prevent zooming out
        leaflet.value.setMinZoom(zoom)
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
        url = `${COMRES_REST_URL}/${region.name}/MapServer/`
        // https://developers.arcgis.com/esri-leaflet/api-reference/layers/dynamic-map-layer/
        const wmsLayer = esriLeaflet.dynamicMapLayer({
          url: url,
          pane: 'overlayPane',
          layers: [layer.id],
          transparent: true,
          format: 'image/png',
          minZoom: MIN_WMS_ZOOM
        })
        wmsLayer.name = `${layer.name} - ${region.name}`
        wmsLayer.id = layer.id
        wmsLayers.value[region.name] = wmsLayers.value[region.name] || []
        wmsLayers.value[region.name].push(wmsLayer)

        // Listen for tile load errors
        wmsLayer.on('error', () => {
          erroredLayers.value.add(wmsLayer)
        })
        wmsLayer.on('tileerror', () => {
          erroredLayers.value.add(wmsLayer)
        })
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
        
          <button class="zoom-button"
                  style="margin: 10px 0px;border: 1px solid #ccc; padding: 10px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);"
          >Zoom to this location</button>

        </p>
        `
      popup.setLatLng(e.latlng).setContent(content).openOn(leaflet.value)

      // Add event listener for the "Zoom to this location" button
      const zoomButton = popup.getElement().querySelector('.zoom-button')
      zoomButton.addEventListener('click', function () {
        zoomToFeature(feature) // Call the local zoomToFeature function
      })
    })
    return featureLayer
  }

  function zoomToFeature(feature) {
    // zoom to the feature bounds
    console.log(feature)
    const bounds = L.geoJSON(feature).getBounds()
    leaflet.value.fitBounds(bounds)
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
    control,
    stageValue,
    determineCogsForStage,
    addCogsToMap,
    clearCogsFromMap,
    erroredLayers,
    initializeMap,
    updateVisibleWMSLayers
  }
})

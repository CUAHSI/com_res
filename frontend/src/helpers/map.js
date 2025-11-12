import { nextTick, ref, shallowRef } from 'vue'
import { storeToRefs } from 'pinia'
import L, { canvas } from 'leaflet'
import 'proj4leaflet'
import proj4 from 'proj4'
import * as esriLeaflet from 'esri-leaflet'
import * as esriLeafletGeocoder from 'esri-leaflet-geocoder'
import { useFeaturesStore } from '@/stores/features'
import { useAlertStore } from '@/stores/alerts'
import { ENDPOINTS } from '@/constants'
import parseGeoraster from 'georaster'

const leaflet = shallowRef(null)
const wmsLayers = shallowRef({})
const mapObject = ref(new Map())
const flowlinesFeatureLayers = shallowRef([])
const featureLayerProviders = shallowRef([])
const activeFeatureLayer = shallowRef(null)
const control = shallowRef(null)
const layerControlIsExpanded = ref(false)
const featureOptions = ref({
  selectedColor: '#00FFFF', // Cyan color for selected features
  defaultColor: 'blue',
  defaultWeight: 2,
  selectedWeight: 5,
  opacity: 0.7
})
const mapLoaded = ref(false)
const isMapMoving = ref(false) // Track if the map is currently moving
const stageValue = ref(5) // Default stage value for the slider

const MIN_WMS_ZOOM = 9
const MIN_WFS_ZOOM = 9
const COMRES_REST_URL = 'https://arcgis.cuahsi.org/arcgis/rest/services/CIROH-ComRes'
//const COMRES_SERVICE_URL = 'https://arcgis.cuahsi.org/arcgis/services/CIROH-ComRes'

const deselectFeature = (feature) => {
  try {
    activeFeatureLayer.value.setFeatureStyle(feature.id, {
      color: featureOptions.value.defaultColor,
      weight: featureOptions.value.defaultWeight
    })
    // dismiss leaflet popups
    leaflet.value.closePopup()

    // clear the cogs from the map
    clearCogsFromMap()
  } catch (error) {
    console.warn('Attempted to deselect feature:', error)
  }
}

const selectFeature = async (feature) => {
  const featureStore = useFeaturesStore()
  const { activeFeature, selectedFeatures, toggledStageSlider } = storeToRefs(featureStore)
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
      if (!fimCogData) {
        console.log(
          `No FIM COG data found for reach: ${feature.properties?.reach_id || feature.properties?.COMID}.`
        )
        return
      } else {
        saveCatalogDataToFeature(activeFeature, fimCogData)
        // also save the data to the original feature object
        feature = {
          ...feature,
          properties: {
            ...feature.properties,
            fimCogData: fimCogData
          }
        }
        // save the data into selectedFeatures as well
        for (let i = 0; i < selectedFeatures.value.length; i++) {
          if (selectedFeatures.value[i].id === feature.id) {
            selectedFeatures.value[i] = feature
            break
          }
        }
      }
    }
    console.log('FIM COG DATA:', fimCogData)
    // fimCogData is now an object containing 3 arrays: files, flows_cms, and stages_m
    const cogUrls = determineCogsForStage(fimCogData.files, fimCogData.stages_m)
    if (cogUrls.length === 0) {
      console.log(
        `No COGs found for reach: ${feature.properties?.reach_id || feature.properties?.COMID} with selected stage: ${stageValue.value}m.`
      )
      return
    }
    // if flood maps are enabled, add the cogs to the map
    if (toggledStageSlider.value) {
      addCogsToMap(cogUrls)
    }
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

const saveCatalogDataToFeature = (featureRef, fimCogData) => {
  // Save the fetched FIM COG data to the feature properties
  console.log('Saving FIM COG data to feature properties:')
  if (!featureRef.value.properties) {
    featureRef.value.properties = {}
  }
  // featureRef.value.properties.fimCogData = fimCogData
  featureRef.value = {
    ...featureRef.value,
    properties: {
      ...featureRef.value.properties,
      fimCogData: fimCogData
    }
  }

  console.log('Saved FIM COG data to feature properties:', fimCogData)
  console.log('Updated feature properties:', featureRef.value.properties)
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

const addCogsToMap = async (cogs) => {
  const alertStore = useAlertStore()
  
  for (let cog of cogs) {
    try {
      const response = await fetch(cog)
      const arrayBuffer = await response.arrayBuffer()
      const georaster = await parseGeoraster(arrayBuffer)
      
      console.log('Georaster structure:', georaster)
      console.log('NoData value:', georaster.noDataValue)

      // Convert the raster to a canvas image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = georaster.width
      canvas.height = georaster.height
      
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height)
      
      // Create image data
      const imageData = ctx.createImageData(georaster.width, georaster.height)
      
      // Debug the values structure more thoroughly
      let values = georaster.values
      console.log('Values structure:', {
        isArray: Array.isArray(values),
        length: values?.length,
        firstElementType: typeof values?.[0],
        firstElementIsArray: Array.isArray(values?.[0]),
        firstElementLength: values?.[0]?.length
      })

      // Since it's [band][pixels] structure with length 328 (height) and each element is an array
      // Let's examine the actual data
      const pixelData = values[0] // First band
      console.log('First few pixels of first row:', pixelData[0]?.slice(0, 10))
      console.log('First few pixels of last row:', pixelData[pixelData.length - 1]?.slice(0, 10))

      const noDataValue = georaster.noDataValue ?? -9999
      let dataPixels = 0
      let minValue = Infinity
      let maxValue = -Infinity
      
      // First pass: analyze the data with correct access pattern
      for (let y = 0; y < georaster.height; y++) {
        const row = pixelData[y]
        if (!Array.isArray(row)) {
          console.log(`Row ${y} is not an array:`, row)
          continue
        }
        
        for (let x = 0; x < georaster.width; x++) {
          const pixelValue = Number(row[x])
          
          // Check if it's valid data (not NaN and not noDataValue)
          if (!isNaN(pixelValue) && pixelValue !== noDataValue) {
            minValue = Math.min(minValue, pixelValue)
            maxValue = Math.max(maxValue, pixelValue)
            dataPixels++
          }
        }
      }
      
      console.log(`Data analysis: ${dataPixels} valid pixels, range: ${minValue} to ${maxValue}`)
      
      // If still no valid data, let's check what values we actually have
      if (dataPixels === 0 || minValue === Infinity) {
        console.log('No valid data found with noDataValue check, checking all values...')
        
        // Check what values we actually have, ignoring noDataValue check
        let allMin = Infinity
        let allMax = -Infinity
        let totalPixels = 0
        
        for (let y = 0; y < georaster.height; y++) {
          const row = pixelData[y]
          if (!Array.isArray(row)) continue
          
          for (let x = 0; x < georaster.width; x++) {
            const pixelValue = Number(row[x])
            if (!isNaN(pixelValue)) {
              allMin = Math.min(allMin, pixelValue)
              allMax = Math.max(allMax, pixelValue)
              totalPixels++
            }
          }
        }
        
        console.log(`All pixel values - Count: ${totalPixels}, Range: ${allMin} to ${allMax}`)
        
        // If we found values but they're all equal to noDataValue, we need to adjust our threshold
        if (totalPixels > 0) {
          console.log('Adjusting noDataValue check or using all values')
          minValue = allMin
          maxValue = allMax
          dataPixels = totalPixels
        }
      }
      
      // Second pass: render the data
      const valueRange = Math.max(1, maxValue - minValue) // Avoid division by zero
      let renderedPixels = 0
      
      for (let y = 0; y < georaster.height; y++) {
        const row = pixelData[y]
        if (!Array.isArray(row)) continue
        
        for (let x = 0; x < georaster.width; x++) {
          const index = (y * georaster.width + x) * 4
          const pixelValue = Number(row[x])
          
          if (isNaN(pixelValue)) {
            // Invalid pixel - transparent
            imageData.data[index + 3] = 0
          } else if (pixelValue === noDataValue) {
            // No-data pixel - transparent
            imageData.data[index + 3] = 0
          } else {
            // Valid data pixel - color based on value
            const normalized = (pixelValue - minValue) / valueRange
            
            // Use blue color with opacity based on normalized value
            // For flood inundation, you might want to adjust this color mapping
            imageData.data[index] = 0                    // R
            imageData.data[index + 1] = 100              // G (slight green tint)
            imageData.data[index + 2] = 255              // B
            imageData.data[index + 3] = Math.floor(normalized * 200) + 55 // A (55-255 opacity)
            
            renderedPixels++
          }
        }
      }
      
      console.log(`Rendered ${renderedPixels} data pixels`)
      
      ctx.putImageData(imageData, 0, 0)
      
      // Verify canvas content
      const imageDataCheck = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let opaquePixels = 0
      for (let i = 3; i < imageDataCheck.data.length; i += 4) {
        if (imageDataCheck.data[i] > 0) opaquePixels++
      }
      console.log(`Canvas has ${opaquePixels} non-transparent pixels`)
      
      // TEMPORARY: Add canvas to DOM for visual inspection
      document.body.appendChild(canvas)
      canvas.style.position = 'fixed'
      canvas.style.top = '10px'
      canvas.style.left = '10px'
      canvas.style.zIndex = '9999'
      canvas.style.border = '2px solid red'
      canvas.style.background = 'white' // Add background to see transparent areas
      
      // Convert canvas to data URL
      const dataURL = canvas.toDataURL('image/png')
      console.log('Data URL created')
      
      // Reproject bounds
      const geographicBounds = reprojectEPSG5070ToWGS84(georaster)
      
      // Add as ImageOverlay
      const overlay = L.imageOverlay(dataURL, geographicBounds, {
        opacity: 0.8,
        interactive: false,
        zIndex: 1000,
      }).addTo(leaflet.value)
      
      console.log('ImageOverlay added to map')
      
      // Add debug elements
      const center = [
        (geographicBounds[0][0] + geographicBounds[1][0]) / 2,
        (geographicBounds[0][1] + geographicBounds[1][1]) / 2
      ]
      
      L.marker(center)
        .addTo(leaflet.value)
        .bindPopup(`COG Debug<br>Valid: ${dataPixels}<br>Rendered: ${renderedPixels}<br>Opaque: ${opaquePixels}<br>Range: ${minValue.toFixed(4)}-${maxValue.toFixed(4)}`)
        .openPopup()
      
      leaflet.value.fitBounds(geographicBounds)
      
    } catch (error) {
      console.error('Error processing COG:', error)
      alertStore.displayAlert({
        title: 'Error Loading COG',
        text: `Failed to load COG: ${error.message}`,
        type: 'error',
        closable: true,
        duration: 5
      })
    }
  }
}
// Keep the same reprojection function
function reprojectEPSG5070ToWGS84(georaster) {
  proj4.defs("EPSG:5070", "+proj=aea +lat_0=23 +lon_0=-96 +lat_1=29.5 +lat_2=45.5 +x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs");
  proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");
  
  const sw = proj4("EPSG:5070", "EPSG:4326", [georaster.xmin, georaster.ymin]);
  const ne = proj4("EPSG:5070", "EPSG:4326", [georaster.xmax, georaster.ymax]);
  const nw = proj4("EPSG:5070", "EPSG:4326", [georaster.xmin, georaster.ymax]);
  const se = proj4("EPSG:5070", "EPSG:4326", [georaster.xmax, georaster.ymin]);
  
  const bounds = [
    [Math.min(sw[1], nw[1], ne[1], se[1]), Math.min(sw[0], nw[0], ne[0], se[0])],
    [Math.max(sw[1], nw[1], ne[1], se[1]), Math.max(sw[0], nw[0], ne[0], se[0])]
  ];
  
  return bounds;
}

const clearCogsFromMap = () => {
  console.log('Clearing all COGs from map')
  leaflet.value.eachLayer((layer) => {
    // if (layer instanceof L.ImageOverlay) {
    //   leaflet.value.removeLayer(layer)
    //   console.log('Removed COG layer:', layer)
    // }
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
      // leaflet.value.setView([0, 0], 2)
      leaflet.value.invalidateSize()
      let zoom = region.defaultZoom || 9
      leaflet.value.setView(bounds.getCenter(), zoom)
      leaflet.value.setZoom(zoom)
      // prevent zooming out beyond min wms zoom
      // leaflet.value.setMinZoom(MIN_WMS_ZOOM)
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
      // https://developers.arcgis.com/esri-leaflet/api-reference/layers/dynamic-map-layer/
      // https://developers.arcgis.com/esri-leaflet/api-reference/layers/tiled-map-layer/
      // TODO: change this to L.esri.tiledMapLayer
      const wmsLayer = esriLeaflet.dynamicMapLayer({
        url: url,
        pane: 'overlayPane',
        layers: [layer.id],
        transparent: true,
        format: 'image/png',
        minZoom: MIN_WMS_ZOOM
        // updateWhenIdle: true
      })
      //      url = `${COMRES_SERVICE_URL}/${region.name}/MapServer/WmsServer?`
      //      console.log(`Creating WMS layer for ${layer.name} at URL: ${url}`)
      //      const wmsLayer = L.tileLayer.wms(url,
      //      {
      //        layers: layer.id,
      //        transparent: true,
      //        format: 'image/png',
      //        minZoom: MIN_WMS_ZOOM,
      //        tiled: true,
      //        updateWhenIdle: true,
      //            crossOrigin: true
      //      })

      console.log(wmsLayer)
      wmsLayer.name = `${layer.name}`
      wmsLayer.id = layer.id
      wmsLayers.value[region.name] = wmsLayers.value[region.name] || []
      wmsLayers.value[region.name].push(wmsLayer)
      console.log(`Created WMS layer: ${wmsLayer.name} for region: ${region.name}`)
    })
  } else {
    console.error(`No layers found for ${region.name}`)
  }
}

async function addWMSLayers(region) {
  for (let layer of wmsLayers.value[region.name] || []) {
    layer.addTo(leaflet.value)
    console.log(`Adding WMS layer: ${layer.name} to map for region: ${region.name}`)
    control.value.addOverlay(layer, layer.name)
  }
}

const toggleWMSLayers = async (region) => {
  // if the regionName is not in wmsLayers, create it
  console.log('Toggling WMS layers for region:', region.name)
  try {
    if (!wmsLayers.value[region.name]) {
      await createWMSLayers(region)
    }
    addWMSLayers(region)

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
  } catch (error) {
    console.error(`Error toggling WMS layers for region ${region.name}:`, error)
  }
}

const showHoverPopup = (feature, latlng, closeable = false) => {
  // Variables to track hover state
  feature.hoverPopup = null
  feature.hoverTimeout = null
  const properties = feature.properties

  const content = `
      ${properties.PopupTitle ? `<h3>${properties.PopupTitle}</h3>` : ''}
      ${properties.PopupSubti ? `<h4>${properties.PopupSubti}</h4>` : ''}
      <ul>
        ${properties.REACHCODE ? `<li>Reach Code: ${properties.REACHCODE}</li>` : ''}
        ${properties.COMID ? `<li>COMID: ${properties.COMID}</li>` : ''}
        ${properties.Hydroseq ? `<li>Hydroseq: ${properties.Hydroseq}</li>` : ''}
        ${properties.SLOPE ? `<li>Slope: ${properties.SLOPE.toFixed(4)}</li>` : ''}
        ${properties.LENGTHKM ? `<li>Length: ${properties.LENGTHKM.toFixed(4)} km</li>` : ''}
        ${properties.GNIS_ID ? `<li>GNIS ID: ${properties.GNIS_ID}</li>` : ''}
      </ul>
    `

  // Determine if we're near the top edge of the map
  // const mapBounds = leaflet.value.getBounds();
  const mapSize = leaflet.value.getSize()
  const point = leaflet.value.latLngToContainerPoint(latlng)
  const isNearTopEdge = point.y < mapSize.y * 0.25 // 25% from top
  let belowLatLng = null

  // For top-edge features, manually reposition the popup below the feature
  if (isNearTopEdge) {
    const popupHeight = 10 // Adjust this based on your popup height

    // Position the popup below the feature (adjusting for popup height)
    const belowPoint = L.point(point.x, point.y + popupHeight)

    // Convert container point back to latlng
    belowLatLng = leaflet.value.containerPointToLatLng(belowPoint)
  }

  // Create and open popup
  feature.hoverPopup = L.popup({
    closeOnClick: false,
    autoClose: false,
    closeButton: closeable,
    className: 'hover-popup',
    maxWidth: 300,
    autoPan: false,
    keepInView: false,
    offset: belowLatLng ? L.point(0, belowLatLng.y) : L.point(0, 0)
  })
    .setLatLng(belowLatLng ? belowLatLng : latlng)
    .setContent(content)
    .openOn(leaflet.value)

  if (isNearTopEdge) {
    setTimeout(() => {
      const popupElement = feature.hoverPopup?.getElement()
      if (popupElement) {
        // Adjust the tip to point upward
        const tipElement = popupElement.querySelector('.leaflet-popup-tip')
        if (tipElement) {
          // Remove the tip
          // TODO figure out how to translate and rotate the tip
          tipElement.remove()
        }
      }
    }, 100)
  }
}

function createFlowlinesFeatureLayer(region) {
  const featureStore = useFeaturesStore()
  const { multiReachMode } = storeToRefs(featureStore)
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

  // Show popup on mouseover
  featureLayer.on('mouseover', (e) => {
    // set cursor to pointer if we are not in multi-reach mode
    if (multiReachMode.value && (e.originalEvent.ctrlKey || e.originalEvent.metaKey)) {
      leaflet.value.getContainer().style.cursor = 'copy'
    } else {
      leaflet.value.getContainer().style.cursor = 'pointer'
    }
    showHoverPopup(e.layer.feature, e.latlng, false)
  })

  // Hide popup on mouseout
  featureLayer.on('mouseout', function (e) {
    leaflet.value.getContainer().style.cursor = ''
    let feature = e.layer.feature
    // Clear the timeout if it hasn't triggered yet
    if (feature.hoverTimeout) {
      clearTimeout(feature.hoverTimeout)
      feature.hoverTimeout = null
    }

    // Close the hover popup
    if (feature.hoverPopup) {
      leaflet.value.closePopup(feature.hoverPopup)
      feature.hoverPopup = null
    }
  })

  // Keep click functionality for feature selection
  featureLayer.on('click', function (e) {
    const feature = e.layer.feature
    console.log('Feature clicked:', feature)
    const isCtrlOrCmdClick = e.originalEvent.ctrlKey || e.originalEvent.metaKey;
    if (isCtrlOrCmdClick && multiReachMode.value) {
      console.log('Multi-select enabled via Ctrl/Cmd key.')
      featureStore.mergeFeature(feature)
    } else {
      featureStore.selectFeature(feature)
    }
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

export {
  mapObject,
  mapLoaded,
  isMapMoving,
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
  showHoverPopup,
  layerControlIsExpanded
}

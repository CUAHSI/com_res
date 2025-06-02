<template>
  <div v-show="$route.meta.showMap" id="mapContainer"></div>
</template>
<script setup>
import 'leaflet/dist/leaflet.css'
import 'leaflet-easybutton/src/easy-button.css'
import L, { canvas } from 'leaflet'
import * as esriLeaflet from 'esri-leaflet'
// WIP https://github.com/CUAHSI/SWOT-Data-Viewer/pull/99/files
import * as esriLeafletGeocoder from 'esri-leaflet-geocoder'
import 'leaflet-easybutton/src/easy-button'
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMapStore } from '@/stores/map'
import { useFeaturesStore } from '@/stores/features'
import { useAlertStore } from '@/stores/alerts'
import { useRegionsStore } from '@/stores/regions'

const mapStore = useMapStore()
const { mapObject, wmsLayers, flowlinesFeatureLayers, featureLayerProviders } =
  storeToRefs(mapStore)
const featureStore = useFeaturesStore()
const alertStore = useAlertStore()
const regionsStore = useRegionsStore()

const MIN_REACH_SELECTION_ZOOM = 11
const MIN_WMS_ZOOM = 9
const MIN_WFS_ZOOM = 9
const COMRES_SERVICE_URL = 'https://arcgis.cuahsi.org/arcgis/services/CIROH-ComRes'
const ACCESS_TOKEN =
  'AAPK7e5916c7ccc04c6aa3a1d0f0d85f8c3brwA96qnn6jQdX3MT1dt_4x1VNVoN8ogd38G2LGBLLYaXk7cZ3YzE_lcY-evhoeGX'

onMounted(() => {
  mapStore.leaflet = L.map('mapContainer').setView([38.2, -96], 5)
  mapObject.value.hucbounds = []
  mapObject.value.popups = []
  mapObject.value.buffer = 20
  mapObject.value.huclayers = []
  mapObject.value.reaches = {}
  mapObject.value.bbox = [99999999, 99999999, -99999999, -99999999]

  //Remove the common zoom control and add it back later later
  mapStore.leaflet.zoomControl.remove()

  let Esri_Hydro_Reference_Overlay = esriLeaflet.tiledMapLayer({
    url: 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Esri_Hydro_Reference_Overlay/MapServer',
    layers: 0,
    transparent: 'true',
    format: 'image/png',
    maxZoom: MIN_REACH_SELECTION_ZOOM,
    minZoom: 0
  })

  let CartoDB_PositronNoLabels = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    {
      noWrap: true,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }
  )

  let url =
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
  let Esri_WorldImagery = L.tileLayer(url, {
    noWrap: true,
    variant: 'World_Imagery',
    attribution: 'Esri',
    maxZoom: 18,
    minZoom: 0
  })

  const baselayers = {
    'ESRI World Imagery': Esri_WorldImagery,
    'CartoDB Positron No Labels': CartoDB_PositronNoLabels
  }

  // add the NOAA flowlines wms
  url =
    'https://maps.water.noaa.gov/server/services/reference/static_nwm_flowlines/MapServer/WMSServer'
  let flowlines = L.tileLayer.wms(url, {
    layers: 0,
    transparent: 'true',
    format: 'image/png',
    minZoom: 8,
    maxZoom: MIN_REACH_SELECTION_ZOOM
  })

  function createFlowlinesFeatureLayer(region) {
    url = `https://arcgis.cuahsi.org/arcgis/rest/services/CIROH-ComRes/${region.name}/FeatureServer/${region.flowlinesLayerNumber}`
    const featureLayer = esriLeaflet.featureLayer({
      url: url,
      simplifyFactor: 0.35,
      precision: 5,
      minZoom: MIN_WFS_ZOOM,
      renderer: canvas({ tolerance: 5 }),
      color: mapStore.featureOptions.defaultColor,
      weight: mapStore.featureOptions.defaultWeight,
      opacity: mapStore.featureOptions.opacity,
      fields: ['FID', 'COMID', 'PopupTitle', 'PopupSubti', 'SLOPE', 'LENGTHKM']
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
          ${properties.SLOPE ? `<li>Slope: ${properties.SLOPE.toFixed(4)}</li>` : ''}
          ${properties.LENGTHKM ? `<li>Length: ${properties.LENGTHKM.toFixed(4)} km</li>` : ''}
            </ul>
        </p>
        `
      popup.setLatLng(e.latlng).setContent(content).openOn(mapStore.leaflet)
    })
    return featureLayer
  }

  function createFeatureLayerProvider(region) {
    url = `https://arcgis.cuahsi.org/arcgis/rest/services/CIROH-ComRes/${region.name}/FeatureServer/${region.flowlinesLayerNumber}`
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

  function createWMSLayer(region) {
    url = `${COMRES_SERVICE_URL}/${region.name}/MapServer/WmsServer?`
    const layer = L.tileLayer.wms(url, {
      layers: region.wmsLayersToLoad,
      transparent: 'true',
      format: 'image/png',
      minZoom: MIN_WMS_ZOOM
    })
    layer.name = region.name
    wmsLayers.value.push(layer)
    return layer
  }
  // create the WMS layers for each region
  for (let region of regionsStore.regions) {
    createWMSLayer(region)
  }

  Esri_WorldImagery.addTo(mapStore.leaflet)
  Esri_Hydro_Reference_Overlay.addTo(mapStore.leaflet)

  for (let layer of wmsLayers.value) {
    layer.addTo(mapStore.leaflet)
  }

  // layer toggling
  let mixed = {
    'ESRI Hydro Reference Overlay': Esri_Hydro_Reference_Overlay,
    'Flowlines WMS': flowlines
  }

  // add the wms layers to the mixed object
  for (let layer of wmsLayers.value) {
    mixed[layer.name] = layer
  }

  // for every region, create a flowlines feature layer and add it to mapstore.flowlinesFeatureLayers
  // and the leaflet map
  for (let region of regionsStore.regions) {
    const flowlines = createFlowlinesFeatureLayer(region)
    flowlinesFeatureLayers.value.push(flowlines)
    const provider = createFeatureLayerProvider(region)
    featureLayerProviders.value.push(provider)
    region.flowlinesLayer = flowlines
    mixed[`${region.name} flowlines`] = flowlines
  }

  const addressSearchProvider = esriLeafletGeocoder.arcgisOnlineProvider({
    apikey: ACCESS_TOKEN,
    maxResults: 3
    // nearby: {
    //   lat: -33.8688,
    //   lng: 151.2093
    // }
  })

  // add the address search provider to the featureLayerProviders
  const providers = [addressSearchProvider, ...featureLayerProviders.value]

  // /*
  //  * LEAFLET BUTTONS
  //  */

  // Layer Control
  L.control.layers(baselayers, mixed).addTo(mapStore.leaflet)

  // Geocoder Control
  // https://developers.arcgis.com/esri-leaflet/api-reference/controls/geosearch/
  esriLeafletGeocoder
    .geosearch({
      position: 'topright',
      placeholder: 'Search for a location',
      useMapBounds: true,
      expanded: false,
      title: ' Search',
      providers: providers
    })
    .addTo(mapStore.leaflet)

  // add zoom control again they are ordered in the order they are added
  L.control
    .zoom({
      position: 'topleft'
    })
    .addTo(mapStore.leaflet)

  // Erase
  L.easyButton(
    'fa-eraser',
    function () {
      clearSelection()
    },
    'clear selected features'
  ).addTo(mapStore.leaflet)

  // on zoom event, log the current bounds and zoom level
  mapStore.leaflet.on('zoomend moveend', function () {
    let zoom = mapStore.leaflet.getZoom()
    console.log('zoom level:', zoom)
    // log the bounds as [[lat, long], [lat, long]]
    let bounds = mapStore.leaflet.getBounds()
    console.log('bounds:', bounds._northEast, bounds._southWest)
    console.log('map center:', mapStore.leaflet.getCenter())
  })

  mapStore.mapLoaded = true
})

/*
 * LEAFLET HANDLERS
 */

function clearSelection() {
  // Clears the selected features on the map

  featureStore.clearSelectedFeatures()

  // update the map
  updateMapBBox()

  // clear and update the HUC textbox
  // document.querySelector('.mdl-textfield').MaterialTextfield.change('');
  alertStore.displayAlert({
    title: 'Cleared',
    text: 'Your map selection was cleared',
    type: 'info',
    closable: true,
    duration: 1
  })
}

function updateMapBBox() {
  /**
   * Calculates and draws the bounding box on the map.
   * This is computed using the wgs84_bbox variable stored
   * within Map.hucbounds. This also calculates the bbox in the
   * nwm coordinates which are used for subsetting NWM data.
   */

  // calculate global boundary
  let xmin = 9999999
  let ymin = 9999999
  let xmax = -9999999
  let ymax = -9999999
  for (let key in mapObject.value.hucbounds) {
    let bounds = mapObject.value.hucbounds[key].wgs84_bbox
    if (bounds.getWest() < xmin) {
      xmin = bounds.getWest()
    }
    if (bounds.getSouth() < ymin) {
      ymin = bounds.getSouth()
    }
    if (bounds.getEast() > xmax) {
      xmax = bounds.getEast()
    }
    if (bounds.getNorth() > ymax) {
      ymax = bounds.getNorth()
    }
  }

  console.log('updating leaflet bbox with values:')
  console.log('xmin', xmin)
  console.log('ymin', ymin)
  console.log('xmax', xmax)
  console.log('ymax', ymax)

  // save the map bbox
  mapObject.value.bbox = [xmin, ymin, xmax, ymax]

  // remove the old bounding box layer
  removeBbox()

  // draw the new bounding box layer
  drawBbox()
}

function removeBbox() {
  // remove the bbox layer if it exists
  if ('BBOX' in mapObject.value.huclayers) {
    // remove the polygon overlay
    mapObject.value.huclayers['BBOX'].clearLayers()
    delete mapObject.value.huclayers['BBOX']
  }
}
function drawBbox() {
  let style = {
    fillColor: 'black',
    weight: 2,
    opacity: 1,
    color: 'green',
    fillOpacity: 0.01,
    lineJoin: 'round'
  }

  // redraw the bbox layer with new coordinates
  let polygon = [
    {
      type: 'Polygon',
      coordinates: [
        [
          [mapObject.value.bbox[0], mapObject.value.bbox[1]],
          [mapObject.value.bbox[0], mapObject.value.bbox[3]],
          [mapObject.value.bbox[2], mapObject.value.bbox[3]],
          [mapObject.value.bbox[2], mapObject.value.bbox[1]],
          [mapObject.value.bbox[0], mapObject.value.bbox[1]]
        ]
      ]
    }
  ]
  let json_polygon = L.geoJSON(polygon, { style: style })

  mapObject.value.huclayers['BBOX'] = json_polygon
  if (featureStore?.selectedModel?.input == 'bbox') {
    json_polygon.addTo(mapStore.leaflet)
  }

  // TODO: Not sure if this is still needed
}
</script>
<style scoped>
#mapContainer {
  width: 100%;
  height: 100%;
}
</style>

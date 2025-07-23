<template>
  <div v-show="$route.meta.showMap" id="mapContainer"></div>
</template>
<script setup>
import 'leaflet/dist/leaflet.css'
import 'leaflet-easybutton/src/easy-button.css'
import L from 'leaflet'
import * as esriLeaflet from 'esri-leaflet'
// WIP https://github.com/CUAHSI/SWOT-Data-Viewer/pull/99/files
import * as esriLeafletGeocoder from 'esri-leaflet-geocoder'
import 'leaflet-easybutton/src/easy-button'
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMapStore } from '@/stores/map'
import { useFeaturesStore } from '@/stores/features'
import { useAlertStore } from '@/stores/alerts'

const mapStore = useMapStore()
const { mapObject, featureLayerProviders, control, leaflet, pendingLayerChanges } =
  storeToRefs(mapStore)
const featureStore = useFeaturesStore()
const alertStore = useAlertStore()

const MIN_REACH_SELECTION_ZOOM = 11
const ACCESS_TOKEN =
  'AAPK7e5916c7ccc04c6aa3a1d0f0d85f8c3brwA96qnn6jQdX3MT1dt_4x1VNVoN8ogd38G2LGBLLYaXk7cZ3YzE_lcY-evhoeGX'

onMounted(() => {
  leaflet.value = L.map('mapContainer').setView([38.2, -96], 5)
  patchLeafletZoomCrashes(leaflet.value)

  mapObject.value.hucbounds = []
  mapObject.value.popups = []
  mapObject.value.buffer = 20
  mapObject.value.huclayers = []
  mapObject.value.reaches = {}
  mapObject.value.bbox = [99999999, 99999999, -99999999, -99999999]

  //Remove the common zoom control and add it back later later
  leaflet.value.zoomControl.remove()

  let Esri_Hydro_Reference_Overlay = esriLeaflet.tiledMapLayer({
    url: 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Esri_Hydro_Reference_Overlay/MapServer',
    layers: 0,
    transparent: 'true',
    format: 'image/png',
    maxZoom: MIN_REACH_SELECTION_ZOOM,
    minZoom: 0
  })

  let url =
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
  let Esri_WorldImagery = L.tileLayer(url, {
    noWrap: true,
    variant: 'World_Imagery',
    attribution: 'Esri',
    maxZoom: 18,
    minZoom: 0
  })

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
    'USGS Imagery': USGS_Imagery,
    'ESRI World Imagery': Esri_WorldImagery,
    'ESRI Hydro Reference Overlay': Esri_Hydro_Reference_Overlay
  }

  Esri_WorldImagery.addTo(leaflet.value)

  // layer toggling
  let mixed = {
    'ESRI Hydro Reference Overlay': Esri_Hydro_Reference_Overlay
  }

  const addressSearchProvider = esriLeafletGeocoder.arcgisOnlineProvider({
    apikey: ACCESS_TOKEN,
    maxResults: 3
  })

  // add the address search provider to the featureLayerProviders
  const providers = [addressSearchProvider, ...featureLayerProviders.value]

  // /*
  //  * LEAFLET BUTTONS
  //  */

  // Layer Control
  control.value = L.control.layers(baselayers, mixed).addTo(leaflet.value)

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
    .addTo(leaflet.value)

  // add zoom control again they are ordered in the order they are added
  L.control
    .zoom({
      position: 'topleft'
    })
    .addTo(leaflet.value)

  // Erase
  L.easyButton(
    'fa-eraser',
    function () {
      clearSelection()
    },
    'clear selected features'
  ).addTo(leaflet.value)

  // on zoom event, log the current bounds and zoom level
  leaflet.value.on('zoomend moveend', function () {
    let zoom = leaflet.value.getZoom()
    console.log('zoom level:', zoom)
    // log the bounds as [[lat, long], [lat, long]]
    let bounds = leaflet.value.getBounds()
    console.log('bounds:', bounds._northEast, bounds._southWest)
    console.log('map center:', leaflet.value.getCenter())
  })

  leaflet.value.on('zoomend', () => {
    for (const { old, new: newLayer } of pendingLayerChanges.value) {
      if (leaflet.value.hasLayer(old)) {
        leaflet.value.removeLayer(old)
      }
      leaflet.value.addLayer(newLayer)
    }
    pendingLayerChanges.value.length = 0 // clear list
  })

  mapStore.mapLoaded = true
})

function patchLeafletZoomCrashes(map) {
  // Patch #1: Suppress crashes in _animateZoom
  const originalAnimateZoom = map._animateZoom
  map._animateZoom = function (center, zoom, origin, scale, delta) {
    try {
      if (!this._mapPane || !this._mapPane.style) return
      originalAnimateZoom.call(this, center, zoom, origin, scale, delta)
    } catch (e) {
      if (e instanceof TypeError && /getZoomScale|get.*?options/.test(e.message)) {
        console.warn('Suppressed Leaflet zoom animation error:', e.message)
      } else {
        throw e
      }
    }
  }

  // Patch #2: Suppress crashes in _onZoomTransitionEnd
  const originalZoomTransitionEnd = map._onZoomTransitionEnd
  map._onZoomTransitionEnd = function (e) {
    try {
      originalZoomTransitionEnd.call(this, e)
    } catch (err) {
      if (err instanceof TypeError && /options/.test(err.message)) {
        console.warn('Suppressed Leaflet zoom transition error:', err.message)
      } else {
        throw err
      }
    }
  }
}

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
    json_polygon.addTo(leaflet.value)
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

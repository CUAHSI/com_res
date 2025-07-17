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

const mapStore = useMapStore()
const { mapObject, featureLayerProviders, control, leaflet, wmsLayers, erroredLayers } =
  storeToRefs(mapStore)

// Store information to fix broken map state that occurs
// when zooming fast.
let zooming = false
let updateTimeout = null
let lastZoom = null

const MIN_REACH_SELECTION_ZOOM = 11
const ACCESS_TOKEN =
  'AAPK7e5916c7ccc04c6aa3a1d0f0d85f8c3brwA96qnn6jQdX3MT1dt_4x1VNVoN8ogd38G2LGBLLYaXk7cZ3YzE_lcY-evhoeGX'

onMounted(() => {
  leaflet.value = L.map('mapContainer').setView([38.2, -96], 5)
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

  Esri_WorldImagery.addTo(leaflet.value)
  Esri_Hydro_Reference_Overlay.addTo(leaflet.value)

  // layer toggling
  let mixed = {
    'ESRI Hydro Reference Overlay': Esri_Hydro_Reference_Overlay,
    'Flowlines WMS': flowlines
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

  //  // Erase
  //  L.easyButton(
  //    'fa-eraser',
  //    function () {
  //      clearSelection()
  //    },
  //    'clear selected features'
  //  ).addTo(leaflet.value)

  //  // on zoom event, log the current bounds and zoom level
  //  leaflet.value.on('zoomend moveend', function () {
  //    let zoom = leaflet.value.getZoom()
  //    console.log('zoom level:', zoom)
  //    // log the bounds as [[lat, long], [lat, long]]
  //    let bounds = leaflet.value.getBounds()
  //    console.log('bounds:', bounds._northEast, bounds._southWest)
  //    console.log('map center:', leaflet.value.getCenter())
  //  })
  mapStore.mapLoaded = true

  leaflet.value.on('zoomend', () => {
    zooming = false // Reset zooming state
    if (updateTimeout) clearTimeout(updateTimeout)

    updateTimeout = setTimeout(() => {
      const currentZoom = leaflet.value.getZoom()
      if (currentZoom !== lastZoom) {
        lastZoom = currentZoom
        updateVisibleWMSLayers() // a function that refreshes your visible layers
      }
    }, 150) // adjust delay as needed
  })

  leaflet.value.on('zoomstart', () => {
    if (!leaflet.value.getContainer() || !leaflet.value._mapPane) {
      zooming = true
      console.warn('Skipping zoom: Map container or pane not ready')
      return
    }
  })
})

function updateVisibleWMSLayers() {
  console.log('Updating visible WMS layers at zoom level', leaflet.value.getZoom())
  const zoom = leaflet.value.getZoom()

  Object.keys(wmsLayers.value).forEach((region) => {
    for (const layer of wmsLayers.value[region]) {
      // Example logic: hide layers if outside zoom range
      if (zoom < 8 || zoom > 16) {
        // This should be replaced with Min and Max layer zoom levels
        if (leaflet.value.hasLayer(layer)) leaflet.value.removeLayer(layer)
      } else {
        if (!leaflet.value.hasLayer(layer)) leaflet.value.addLayer(layer)
      }

      // Recovery mechanism for broken layers
      if (erroredLayers.value.has(layer)) {
        console.warn(`Resetting errored WMS layer: ${layer.name}`)
        erroredLayers.value.delete(layer)

        const resetLayer = () => {
          if (leaflet.value.hasLayer(layer)) {
            leaflet.value.removeLayer(layer)
          }

          // Re-add the layer in the *next* animation frame after DOM stabilizes
          requestAnimationFrame(() => {
            setTimeout(() => {
              try {
                if (!leaflet.value.hasLayer(layer)) {
                  leaflet.value.addLayer(layer)
                }
              } catch (e) {
                console.error(`Failed to re-add layer ${layer.name}`, e)
              }
            }, 100)
          })
        }

        if (zooming) {
          // Delay the reset until zoom has ended
          console.warn('Delaying WMS layer reset until zoom completes')
          leaflet.value.once('zoomend', resetLayer)
        } else {
          resetLayer()
        }
      }
    }
  })
}
</script>
<style scoped>
#mapContainer {
  width: 100%;
  height: 100%;
}
</style>

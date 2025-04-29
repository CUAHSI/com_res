<template>
  <div v-show="$route.meta.showMap" id="mapContainer"></div>
</template>
<script setup>
import 'leaflet/dist/leaflet.css'
import 'leaflet-easybutton/src/easy-button.css'
import L, { canvas } from 'leaflet'
import * as esriLeaflet from 'esri-leaflet'
import 'leaflet-easybutton/src/easy-button'
import { onMounted, onUpdated, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMapStore } from '@/stores/map'
import { useFeaturesStore } from '@/stores/features'
import { useAlertStore } from '@/stores/alerts'
import { GIS_SERVICES_URL } from '@/constants'

const mapStore = useMapStore()
const { mapObject } = storeToRefs(mapStore)
const featureStore = useFeaturesStore()
const alertStore = useAlertStore()

const minReachSelectionZoom = 11

onUpdated(() => {
  mapObject.value.leaflet.invalidateSize()
})
onMounted(() => {
  let leaflet = L.map('mapContainer').setView([38.2, -96], 5)
  mapObject.value.leaflet = leaflet
  mapObject.value.hucbounds = []
  mapObject.value.popups = []
  mapObject.value.buffer = 20
  mapObject.value.huclayers = []
  mapObject.value.selected_hucs = []
  mapObject.value.reaches = {}
  mapObject.value.flowlinesFeatures = ref({})

  mapObject.value.bbox = [99999999, 99999999, -99999999, -99999999]

  let Esri_Hydro_Reference_Overlay = esriLeaflet.tiledMapLayer({
    url: 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Esri_Hydro_Reference_Overlay/MapServer',
    layers: 0,
    transparent: 'true',
    format: 'image/png',
    maxZoom: minReachSelectionZoom,
    minZoom: 0
  })

  let CartoDB_PositronNoLabels = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }
  )

  let url =
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
  let Esri_WorldImagery = L.tileLayer(url, {
    variant: 'World_Imagery',
    attribution: 'Esri',
    maxZoom: 18,
    minZoom: 0
  })

  const baselayers = {
    'ESRI World Imagery': Esri_WorldImagery,
    'CartoDB Positron No Labels': CartoDB_PositronNoLabels
  }

  Esri_WorldImagery.addTo(leaflet)
  Esri_Hydro_Reference_Overlay.addTo(leaflet)

  // add USGS gage layer to map
  url = `${GIS_SERVICES_URL}/NHD/usgs_gages/MapServer/WmsServer?`
  let gages = L.tileLayer
    .wms(url, {
      layers: 0,
      transparent: 'true',
      format: 'image/png',
      minZoom: 9,
      maxZoom: 18
    })
    .addTo(leaflet)

  // add the NOAA flowlines wms
  url =
    'https://maps.water.noaa.gov/server/services/reference/static_nwm_flowlines/MapServer/WMSServer'
  let flowlines = L.tileLayer
    .wms(url, {
      layers: 0,
      transparent: 'true',
      format: 'image/png',
      minZoom: 8,
      maxZoom: minReachSelectionZoom
    })
    .addTo(leaflet)

  // add static flowlines feature service
  url =
    'https://maps.water.noaa.gov/server/rest/services/reference/static_nwm_flowlines/FeatureServer/0/query'
  const flowlinesFeatures = esriLeaflet
    .featureLayer({
      url: url,
      renderer: canvas({ tolerance: 5 }),
      simplifyFactor: 0.35,
      precision: 5,
      minZoom: minReachSelectionZoom,
      maxZoom: 18,
      color: mapStore.featureOptions.defaultColor,
      weight: mapStore.featureOptions.defaultWeight,
      opacity: mapStore.featureOptions.opacity
      // fields: ["FID", "ZIP", "PO_NAME"],
    })
    .addTo(leaflet)

  mapObject.value.flowlinesFeatures = flowlinesFeatures

  flowlinesFeatures.on('click', async function (e) {
    const feature = e.layer.feature
    featureStore.clearSelectedFeatures()
    if (!featureStore.checkFeatureSelected(feature)) {
      // Only allow one feature to be selected at a time
      featureStore.selectFeature(feature)
    }
  })

  // layer toggling
  let mixed = {
    'USGS Gages': gages,
    'ESRI Hydro Reference Overlay': Esri_Hydro_Reference_Overlay,
    'Flowlines WMS': flowlines,
    'Flowlines Features': flowlinesFeatures
  }

  // /*
  //  * LEAFLET BUTTONS
  //  */

  // Erase
  L.easyButton(
    'fa-eraser',
    function () {
      clearSelection()
    },
    'clear selected features'
  ).addTo(leaflet)

  // Layer Control
  L.control.layers(baselayers, mixed).addTo(leaflet)

  /*
   * LEAFLET EVENT HANDLERS
   */
  leaflet.on('click', function (e) {
    mapClick(e)
  })

  mapStore.mapLoaded = true
})

/*
 * LEAFLET HANDLERS
 */

async function mapClick(e) {
  /*
   * The event handler for map click events
   * @param {event} e - a map mouse click event
   * @returns - null
   */

  // exit early if not zoomed in enough.
  // this ensures that objects are not clicked until zoomed in
  let zoom = e.target.getZoom()
  if (zoom < mapObject.value.selectable_zoom) {
    return
  }
}

function clearSelection() {
  // Clears the selected features on the map

  for (let key in mapObject.value.hucbounds) {
    // clear the huc boundary list
    delete mapObject.value.hucbounds[key]

    // clear the polygon overlays
    mapObject.value.huclayers[key].clearLayers()
    delete mapObject.value.huclayers[key]

    // clear the hucs in the html template
  }
  mapObject.value.selected_hucs = []

  // clear the HUC table
  // clearHucTable();

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
    json_polygon.addTo(mapObject.value.leaflet)
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

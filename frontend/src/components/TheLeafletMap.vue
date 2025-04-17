<template>
  <div v-show="$route.meta.showMap" id="mapContainer"></div>
</template>
<script setup>
import 'leaflet/dist/leaflet.css'
import 'leaflet-easybutton/src/easy-button.css'
import L from 'leaflet'
import * as esriLeaflet from 'esri-leaflet'
import 'leaflet-easybutton/src/easy-button'
import { onMounted, onUpdated } from 'vue'
import { useMapStore } from '@/stores/map'
import { useFeaturesStore } from '@/stores/features'
import { useAlertStore } from '@/stores/alerts'
import { GIS_SERVICES_URL } from '@/constants'

const mapStore = useMapStore()
const featuresStore = useFeaturesStore()
const alertStore = useAlertStore()

const Map = mapStore.mapObject

onUpdated(() => {
  Map.map.invalidateSize()
})
onMounted(() => {
  let map = L.map('mapContainer').setView([38.2, -96], 5)
  Map.map = map
  Map.hucbounds = []
  Map.popups = []
  Map.buffer = 20
  Map.huclayers = []
  Map.selected_hucs = []
  Map.reaches = {}
  Map.huc2_min = 0
  Map.huc2_max = 7
  Map.huc4_min = 6
  Map.huc4_max = 10
  Map.huc6_min = 6
  Map.huc6_max = 10
  Map.huc10_min = 9
  Map.huc10_max = 14
  Map.huc12_min = 10
  Map.huc12_max = 18

  Map.bbox = [99999999, 99999999, -99999999, -99999999]

  // Initial OSM tile layer
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
    'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Esri_Hydro_Reference_Overlay/MapServer'
  // url = 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Esri_Hydro_Reference_Labels/MapServer'

  let Esri_Hydro_Reference_Overlay = esriLeaflet.tiledMapLayer({
    url: url,
    layers: 0,
    transparent: 'true',
    format: 'image/png'
  })

  url =
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
  let Esri_WorldImagery = L.tileLayer(url, {
    variant: 'World_Imagery',
    attribution: 'Esri'
  })

  const baselayers = {
    CartoDB_PositronNoLabels,
    Esri_WorldImagery
  }

  Esri_WorldImagery.addTo(map)
  Esri_Hydro_Reference_Overlay.addTo(map)

  // WMS LAYER
  url = `${GIS_SERVICES_URL}/US_WBD/HUC_WBD/MapServer/WmsServer?`

  // HUC WMS Naming
  // --------------
  // HUC12_US: 0
  // HUC10_US: 1
  // HUC_4_US: 2
  // HUC2_US: 3
  // --------------

  // HUC 2 Layer
  let huc2 = L.tileLayer
    .wms(url, {
      layers: 4,
      transparent: 'true',
      format: 'image/png',
      minZoom: Map.huc2_min,
      maxZoom: Map.huc2_max
    })
    .addTo(map)

  // HUC 4 Layer
  let huc4 = L.tileLayer
    .wms(url, {
      layers: 3,
      transparent: 'true',
      format: 'image/png',
      minZoom: Map.huc4_min,
      maxZoom: Map.huc4_max
    })
    .addTo(map)

  // HUC 12 Layer
  let huc12 = L.tileLayer
    .wms(url, {
      layers: 2,
      transparent: 'true',
      format: 'image/png',
      minZoom: Map.huc12_min,
      maxZoom: Map.huc12_max
    })
    .addTo(map)

  // HUC 10 Layer
  let huc10 = L.tileLayer
    .wms(url, {
      layers: 1,
      transparent: 'true',
      format: 'image/png',
      minZoom: Map.huc10_min,
      maxZoom: Map.huc10_max
    })
    .addTo(map)

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
    .addTo(map)

  // layer toggling
  let mixed = {
    'HUC 2': huc2,
    'HUC 4': huc4,
    'HUC 10': huc10,
    'HUC 12': huc12,
    'USGS Gages': gages,
    'Esri Hydro Reference Overlay': Esri_Hydro_Reference_Overlay
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
  ).addTo(map)

  // Layer Control
  L.control.layers(baselayers, mixed).addTo(map)

  /*
   * LEAFLET EVENT HANDLERS
   */
  map.on('click', function (e) {
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
  if (zoom < Map.selectable_zoom) {
    return
  }
}

function clearSelection() {
  // Clears the selected features on the map

  for (let key in Map.hucbounds) {
    // clear the huc boundary list
    delete Map.hucbounds[key]

    // clear the polygon overlays
    Map.huclayers[key].clearLayers()
    delete Map.huclayers[key]

    // clear the hucs in the html template
  }
  Map.selected_hucs = []

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
  for (let key in Map.hucbounds) {
    let bounds = Map.hucbounds[key].wgs84_bbox
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
  Map.bbox = [xmin, ymin, xmax, ymax]

  // remove the old bounding box layer
  removeBbox()

  // draw the new bounding box layer
  drawBbox()
}

function removeBbox() {
  // remove the bbox layer if it exists
  if ('BBOX' in Map.huclayers) {
    // remove the polygon overlay
    Map.huclayers['BBOX'].clearLayers()
    delete Map.huclayers['BBOX']
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
          [Map.bbox[0], Map.bbox[1]],
          [Map.bbox[0], Map.bbox[3]],
          [Map.bbox[2], Map.bbox[3]],
          [Map.bbox[2], Map.bbox[1]],
          [Map.bbox[0], Map.bbox[1]]
        ]
      ]
    }
  ]
  let json_polygon = L.geoJSON(polygon, { style: style })

  Map.huclayers['BBOX'] = json_polygon
  if (featuresStore?.selectedModel?.input == 'bbox') {
    json_polygon.addTo(Map.map)
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

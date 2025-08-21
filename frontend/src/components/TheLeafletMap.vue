<template>
  <div v-show="$route.meta.showMap" id="mapContainer"></div>
  <v-progress-linear v-if="isMapMoving" indeterminate color="primary"></v-progress-linear>
  <ContextMenu 
    v-if="contextMenu.show"
    :context="contextMenu"
    @close="contextMenu.show = false"
    @zoom-to-feature="contextZoomToFeature"
    @select-feature="contextSelectFeature"
    @show-feature-info="contextShowFeatureInfo"
    @dismiss="dismissContextMenu"
  />
</template>
<script setup>
import 'leaflet/dist/leaflet.css'
import 'leaflet-easybutton/src/easy-button.css'
import L from 'leaflet'
import * as esriLeaflet from 'esri-leaflet'
// WIP https://github.com/CUAHSI/SWOT-Data-Viewer/pull/99/files
import * as esriLeafletGeocoder from 'esri-leaflet-geocoder'
import 'leaflet-easybutton/src/easy-button'
import { onMounted, ref, watch, nextTick } from 'vue'
import { mapObject, featureLayerProviders, control, leaflet, mapLoaded, isMapMoving, activeFeatureLayer, showHoverPopup, layerControlIsExpanded } from '@/helpers/map'
import { useFeaturesStore } from '@/stores/features'
import { useAlertStore } from '@/stores/alerts'
import ContextMenu from '@/components/ContextMenu.vue'
import { onUnmounted } from 'vue'

const featureStore = useFeaturesStore()
const alertStore = useAlertStore()

const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  feature: null,
  latlng: null,
  pending: false
})

const contextMenuFeatureLatLng = ref(null);
const layerControlExpanded = ref(false)

const ACCESS_TOKEN =
  'AAPK7e5916c7ccc04c6aa3a1d0f0d85f8c3brwA96qnn6jQdX3MT1dt_4x1VNVoN8ogd38G2LGBLLYaXk7cZ3YzE_lcY-evhoeGX'

onMounted(() => {
  // https://leafletjs.com/reference.html#map-zoomsnap
  // https://leafletjs.com/reference.html#map-wheeldebouncetime
  // https://leafletjs.com/reference.html#map-zoomdelta
  leaflet.value = L.map('mapContainer', { zoomSnap: 1, wheelDebounceTime: 100, zoomDelta: 1, zoomControl: false }).setView([38.2, -96], 5)
  mapObject.value.hucbounds = []
  mapObject.value.popups = []
  mapObject.value.buffer = 20
  mapObject.value.huclayers = []
  mapObject.value.reaches = {}
  mapObject.value.bbox = [99999999, 99999999, -99999999, -99999999]

  let CartoDB_PositronNoLabels = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    {
      noWrap: true,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
    }
  )

  let url =
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
  let Esri_WorldImagery = L.tileLayer(url, {
    noWrap: true,
    variant: 'World_Imagery',
    attribution: 'Esri',
  })

  let USGS_Imagery = L.tileLayer(
    'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: 'USGS',
      noWrap: true,
    }
  )

  const baselayers = {
    'ESRI World Imagery': Esri_WorldImagery,
    'CartoDB Positron No Labels': CartoDB_PositronNoLabels,
    'USGS Imagery': USGS_Imagery
  }

  CartoDB_PositronNoLabels.addTo(leaflet.value)

  const Esri_Hydro_Reference_Overlay = esriLeaflet.tiledMapLayer({
    url: 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Esri_Hydro_Reference_Overlay/MapServer',
    layers: 0,
    transparent: 'true',
    format: 'image/png',
  })

  const stamenTerrain = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_terrain_background/{z}/{x}/{y}{r}.jpg', {
    attribution: 'Map tiles by <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://stamen.com">Stamen Design</a>, Data by <a href="https://openstreetmap.org">OpenStreetMap</a>, under <a href="https://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'
  })

  const openTopo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: © <a href="https://opentopomap.org">OpenTopoMap</a>'
  })

  const USGSShadedReliefOnly = L.tileLayer.wms('https://basemap.nationalmap.gov/arcgis/services/USGSShadedReliefOnly/MapServer/WMSServer?', {
    layers: '0', // The layer index for contours
    format: 'image/png',
    transparent: true,
    opacity: 0.7,
    attribution: 'Shaded Relief © <a href="https://www.usgs.gov/">USGS</a>'
  })

  Esri_Hydro_Reference_Overlay.addTo(leaflet.value)

  // layer toggling
  let overlays = {
    'ESRI Hydro Reference Overlay': Esri_Hydro_Reference_Overlay,
    'USGS Shaded Relief': USGSShadedReliefOnly,
    'Stamen Terrain': stamenTerrain,
    'OpenTopoMap': openTopo
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
  //  * LEAFLET CONTROLS
  //  */

  // zoom control
  L.control
    .zoom({
      position: 'topright'
    })
    .addTo(leaflet.value)

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

  // Erase
  L.easyButton(
    {
      states: [{
        icon: 'fa-eraser',
        onClick: function () {
          clearSelection()
        },
        title: 'Clear Selected Features'
      }],
      position: 'topright'
    }
  ).addTo(leaflet.value)

  // Layer Control
  control.value = L.control.layers(baselayers, overlays).addTo(leaflet.value)

  nextTick(() => {
    setupLayerControlObserver()
  })

  leaflet.value.on('dragstart', () => {
    contextMenu.value.pending = true;
    isMapMoving.value = true;
  });

  leaflet.value.on('dragend', () => {
    updateContextMenuPosition();
  });

  leaflet.value.on('movestart', () => {
    contextMenu.value.pending = true;
    isMapMoving.value = true;
  });

  leaflet.value.on('moveend', () => {
    updateContextMenuPosition();
  });

  leaflet.value.on('zoomstart', () => {
    contextMenu.value.pending = true;
    isMapMoving.value = true;
  });

  leaflet.value.on('zoomend', () => {
    updateContextMenuPosition();
  });

  // TODO: update when the layer control is expanded/collapsed
  // update layerControlIsExpanded.value

  mapLoaded.value = true
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
    json_polygon.addTo(leaflet.value)
  }

  // TODO: Not sure if this is still needed
}

// Watch for activeFeatureLayer changes and add contextmenu event
watch(activeFeatureLayer, (newLayer, oldLayer) => {
  console.log("swapping contextmenu listener")
  if (oldLayer) {
    oldLayer.off('contextmenu');
  }

  if (newLayer) {
    newLayer.on('contextmenu', contextFeatureRightClick);
  }
}, { immediate: true });

function contextFeatureRightClick(event) {
  // Prevent the default browser context menu
  event.originalEvent.preventDefault();

  // Get the feature from the event
  const feature = event.layer?.feature;
  if (!feature) return;

  // Store the feature's geographic position
  contextMenuFeatureLatLng.value = event.latlng;

  // Update the context menu position
  updateContextMenuPosition();

  // Show the context menu at the click position
  contextMenu.value = {
    show: true,
    x: event.originalEvent.clientX,
    y: event.originalEvent.clientY,
    feature: feature,
    latlng: event.latlng
  };
}

function updateContextMenuPosition() {
  if (contextMenu.value.show && contextMenuFeatureLatLng.value) {
    // Convert the feature's geographic position to screen coordinates
    const containerPoint = leaflet.value.latLngToContainerPoint(contextMenuFeatureLatLng.value);

    // Get the map container's position relative to the viewport
    const mapRect = leaflet.value.getContainer().getBoundingClientRect();

    // Update the context menu position
    contextMenu.value.x = mapRect.left + containerPoint.x;
    contextMenu.value.y = mapRect.top + containerPoint.y;
  }
  contextMenu.value.pending = false;
  isMapMoving.value = false;
}

function dismissContextMenu(event) {
  contextMenu.value.show = false;
  contextMenuFeatureLatLng.value = null;
}

function contextZoomToFeature() {
  if (contextMenu.value.feature) {
    try {
      // Get the bounds of the feature and zoom to it
      const layer = L.geoJSON(contextMenu.value.feature);
      const bounds = layer.getBounds();
      leaflet.value.fitBounds(bounds, { padding: [50, 50] });
    } catch (error) {
      console.error('Error zooming to feature:', error);
      alertStore.displayAlert({
        title: 'Zoom Error',
        text: 'Could not zoom to the selected feature',
        type: 'error',
        closable: true,
        duration: 3
      });
    }
  }
  contextMenu.value.show = false;
  contextMenuFeatureLatLng.value = null;
}

function selectFeatureHelper(feature) {
  featureStore.clearSelectedFeatures()
  if (!featureStore.checkFeatureSelected(feature)) {
    // Only allow one feature to be selected at a time
    featureStore.selectFeature(feature)
  }
}

function contextSelectFeature() {
  if (contextMenu.value.feature) {
    // Clear any currently selected features
    featureStore.clearSelectedFeatures();

    // Select the right-clicked feature
    featureStore.selectFeature(contextMenu.value.feature);

    // Use the helper function to style the selected feature
    if (activeFeatureLayer.value) {
      selectFeatureHelper(contextMenu.value.feature);
    }
  }
  contextMenu.value.show = false;
  contextMenuFeatureLatLng.value = null;
}

function contextShowFeatureInfo() {
  let feature = contextMenu?.value?.feature
  let latLng = contextMenu?.value?.latlng
  if (feature && latLng) {
    showHoverPopup(feature, latLng)
  }
  contextMenu.value.show = false;
  contextMenuFeatureLatLng.value = null;
}

function setupLayerControlObserver() {
  // Find the layer control element
  const layerControlElement = document.querySelector('.leaflet-control-layers')
  if (!layerControlElement) {
    console.warn('Layer control element not found')
    return
  }
  
  // Create a MutationObserver to watch for class changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const isExpanded = layerControlElement.classList.contains('leaflet-control-layers-expanded')
        layerControlExpanded.value = isExpanded
        layerControlIsExpanded.value = isExpanded
      }
    })
  })
  
  // Start observing the layer control element
  observer.observe(layerControlElement, {
    attributes: true,
    attributeFilter: ['class']
  })
  
  // Store the observer for cleanup
  mapObject.value.layerControlObserver = observer
  
  // Set initial state
  const isInitiallyExpanded = layerControlElement.classList.contains('leaflet-control-layers-expanded')
  layerControlExpanded.value = isInitiallyExpanded
  layerControlIsExpanded.value = isInitiallyExpanded
}

onUnmounted(() => {
  if (leaflet.value) {
    leaflet.value.off('moveend', updateContextMenuPosition)
  }
  
  // Disconnect the observer when component is unmounted
  if (mapObject.value.layerControlObserver) {
    mapObject.value.layerControlObserver.disconnect()
  }
})
</script>
<style scoped>
#mapContainer {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}
</style>

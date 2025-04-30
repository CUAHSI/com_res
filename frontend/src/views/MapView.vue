<template>
  <v-overlay :model-value="!mapStore.mapLoaded" class="align-center justify-center">
    <v-progress-circular indeterminate :size="128"></v-progress-circular>
  </v-overlay>

  <v-container v-if="!mdAndDown" fluid>
    <v-row fill-height style="height: calc(100vh - 165px)">
      <v-col style="padding: 0px; margin: 0px">
        <TheLeafletMap />
      </v-col>
    </v-row>
  </v-container>
  <v-container v-else>
    <v-row style="height: 40vh">
      <TheLeafletMap />
    </v-row>
  </v-container>

  <v-card location="left" :style="getCardStyle()" max-width="500" max-height="145">
    <v-btn
      style="margin-right: 10px"
      @click="toggleMetadata"
      :color="showMetadata ? 'blue' : 'white'"
    >
      Metadata
    </v-btn>
    <v-btn
      style="margin-right: 10px"
      @click="toggleHistorical"
      :color="showHistorical ? 'blue' : 'white'"
    >
      Historical
    </v-btn>
    <v-btn
      style="margin-right: 10px"
      @click="toggleForecast"
      :color="showForecast ? 'blue' : 'white'"
    >
      Forecast
    </v-btn>
  </v-card>

  <v-card
    location="left"
    max-width="500"
    max-height="800"
    :style="{
      transform: 'translate(1vw, -25vh)',
      position: 'absolute',
      backgroundColor: 'transparent',
      'z-index': '9999'
    }"
    v-show="showHistorical"
  >
    <HistoricalPlot
      ref="historicalPlotRef"
      :style="{ width: '500px', height: '300px', padding: '0px 10px' }"
    />
  </v-card>
</template>
<!-- :timeseries="plot_timeseries" -->
<!-- :title="plot_title" -->

<script setup>
import { ref, watch, nextTick, onUpdated, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TheLeafletMap from '@/components/TheLeafletMap.vue'
import { useMapStore } from '@/stores/map'
import { useDisplay } from 'vuetify'
import HistoricalPlot from '@/components/HistoricalPlot.vue'
import { useFeaturesStore } from '@/stores/features'
import { useAlertStore } from '@/stores/alerts'

const { mdAndDown } = useDisplay()
const mapStore = useMapStore()
const router = useRouter()

const featureStore = useFeaturesStore()
const alertStore = useAlertStore()

const showMetadata = ref(false)
const showHistorical = ref(false)
const showForecast = ref(false)
const historicalPlotRef = ref(null)

// Watch the feature_id from the store. When it changes,
// we will update the data displayed in the timeseries plot
// components.
watch(
  () => featureStore.activeFeature?.properties?.feature_id,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      reachIdChanged(newVal)
    }
  }
)

const zoomToBounds = (bounds) => {
  if (bounds) {
    const parsedBounds = JSON.parse(bounds)
    try {
      console.log(`Zooming to bounds: ${parsedBounds}`)
      mapStore.leaflet.fitBounds(parsedBounds)
    } catch (error) {
      console.warn('Error parsing bounds:', error)
    }
  } else {
    alert('No bounds provided')
  }
}

onMounted(() => {
  // update the route query params when the map is zoomed
  try {
    mapStore.leaflet.on('zoomend', () => {
      const bounds = mapStore.leaflet.getBounds()
      // convert the bounds to a format that can be used in the URL
      const boundsString = JSON.stringify([
        [bounds._southWest.lat, bounds._southWest.lng],
        [bounds._northEast.lat, bounds._northEast.lng]
      ])

      const routeQuery = {
        query: {
          ...router.currentRoute.value.query,
          bounds: boundsString
        }
      }
      // update the URL without reloading the page
      router.replace(routeQuery)
    })
  } catch (error) {
    console.warn('Error setting up zoomend event listener:', error)
  }
})

onUpdated(async () => {
  await nextTick()
  // check to see if map bounds and zoom are set on the route query params
  const route = router.currentRoute.value
  const { bounds } = route.query
  if (bounds) {
    zoomToBounds(bounds)
  }
})

const getCardStyle = () => {
  if (!mdAndDown.value) {
    return {
      transform: 'translate(4vw, -37vh)', // top left of map
      position: 'absolute',
      color: 'black',
      backgroundColor: 'transparent',
      'z-index': '9999' // make sure if floats above the map
    }
  }
  // TODO: implement styling and layout for mobile
  return {}
}

const toggleHistorical = async () => {
  // get the feature id from the active feature
  console.log(featureStore.activeFeature)
  let reach_id = featureStore.activeFeature?.properties?.feature_id ?? null
  if (reach_id === undefined || reach_id === null) {
    // if no feature is selected show a popup dialog
    alertStore.displayAlert({
      title: 'No River Reach Selected',
      text: 'You must select a river reach on the map to view historical streamflow data.',
      type: 'error',
      closable: true,
      duration: 5
    })
  } else {
    showHistorical.value = !showHistorical.value

    //
    let start_date = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    let end_date = new Date(Date.now())
    console.log(start_date, end_date)
    let reach_name = featureStore.activeFeature.properties.name

    await historicalPlotRef.value.getHistoricalData(
      reach_id.toString(),
      reach_name,
      start_date,
      end_date
    )
  }
}

const reachIdChanged = async (selected_reach) => {
  console.log('Reach ID CHANGED!!!')
  if (selected_reach === undefined || selected_reach === null) {
    // TODO: clear all reach-related data from the plot and metadata components
    console.log('No reach selected, I need to clear the plots!!!')
    await historicalPlotRef.value.clearPlot()
    return
  }

  // update the historical plot when the selected reach changes
  // only if the historical component is visible
  if (showHistorical.value) {
    // update historical plot when the selected reach changes
    let start_date = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    let end_date = new Date(Date.now())
    let reach_name = featureStore.activeFeature.properties.name

    await historicalPlotRef.value.getHistoricalData(
      selected_reach.toString(),
      reach_name,
      start_date,
      end_date
    )
  }
}
</script>

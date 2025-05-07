<template>
  <v-overlay :model-value="!mapStore.mapLoaded" class="align-center justify-center">
    <v-progress-circular indeterminate :size="128"></v-progress-circular>
  </v-overlay>

  <v-container fluid>
    <div id="div-plot-button" class="desktop-plot-buttons-container">
      <v-card
        location="left"
        variant="flat"
        :style="{
          backgroundColor: 'transparent'
        }"
        max-width="500"
        max-height="145"
      >
        <v-btn
          id="btn-show-historical"
          style="margin-right: 10px"
          @click="toggle('historical')"
          :color="showHistorical ? 'blue' : 'white'"
        >
          Historical
        </v-btn>
        <v-btn
          style="margin-right: 10px"
          @click="toggle('forecast')"
          :color="showForecast ? 'blue' : 'white'"
        >
          Forecast
        </v-btn>
      </v-card>
    </div>

    <v-row
      fill-height
      :class="{ 'desktop-map-container': !mdAndDown, 'mobile-map-container': mdAndDown }"
    >
      <v-col style="padding: 0px; margin: 0px">
        <TheLeafletMap />
      </v-col>
    </v-row>

    <div :class="{ 'mobile-plot-container': mdAndDown, 'desktop-plot-container': !mdAndDown }">
      <HistoricalPlot
        v-show="showHistorical"
        ref="historicalPlotRef"
        :style="{ width: '500px', height: '300px', padding: '0px 10px', margin: '10px 0px' }"
      />

      <ForecastPlot
        v-show="showForecast"
        ref="forecastPlotRef"
        :style="{ width: '500px', height: '300px', padding: '0px 10px', margin: '10px 0px' }"
      />
    </div>
  </v-container>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useMapStore } from '@/stores/map'
import { useDisplay } from 'vuetify'
import HistoricalPlot from '@/components/HistoricalPlot.vue'
import ForecastPlot from '@/components/ForecastPlot.vue'
import { useFeaturesStore } from '@/stores/features'
import { useAlertStore } from '@/stores/alerts'
import TheLeafletMap from '@/components/TheLeafletMap.vue'

const { mdAndDown } = useDisplay()
const mapStore = useMapStore()

const featureStore = useFeaturesStore()
const alertStore = useAlertStore()

const showHistorical = ref(false)
const showForecast = ref(false)
const historicalPlotRef = ref(null)
const forecastPlotRef = ref(null)

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

const toggle = async (component_name) => {
  console.log(component_name)

  // get the feature id from the active feature
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
    return
  }
  let reach_name = featureStore.activeFeature.properties.name

  // toggle plot visualizations
  // based on which button was clicked.
  if (component_name === 'historical') {
    showHistorical.value = !showHistorical.value
    await historicalPlotRef.value.getHistoricalData(
      reach_id.toString(),
      reach_name,
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      new Date(Date.now())
    )
  } else if (component_name === 'forecast') {
    showForecast.value = !showForecast.value
    await forecastPlotRef.value.getForecastData(
      reach_id.toString(),
      reach_name,
      new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      'medium_range',
      '3'
    )
  }
}

const reachIdChanged = async (selected_reach) => {
  // if no reach is selected, clear the plot data.
  if (selected_reach === undefined || selected_reach === null) {
    await historicalPlotRef.value.clearPlot()
    return
  }

  // get the active reach name, this is necessary to update
  // the data displayed in the historical and forecast components
  let reach_name = featureStore.activeFeature.properties.name

  // update the historical plot when the selected reach changes
  // only if the historical component is visible
  if (showHistorical.value) {
    await historicalPlotRef.value.getHistoricalData(
      selected_reach.toString(),
      reach_name,
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      new Date(Date.now())
    )
  }

  // update the forecast plot when the selected reach changes
  // only if the forecast component is visible
  if (showForecast.value) {
    await forecastPlotRef.value.getForecastData(
      selected_reach.toString(),
      reach_name,
      new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      'medium_range',
      '3'
    )
  }
}
</script>
<style scoped>
.desktop-map-container {
  height: calc(100vh - 165px);
}
.desktop-plot-container {
  width: 500px;
  height: calc(100vh - 310px);
  position: fixed;
  top: 225px;
  z-index: 99999;
}
.desktop-plot-buttons-container {
  width: 400px;
  height: 50px;
  position: absolute;
  z-index: 99999;
  transform: translate(45px, 0px);
}

.mobile-map-container {
  height: calc(100vh - 500px);
  min-height: 40vh;
}
.mobile-plot-container {
  width: 102%;
  height: 100%;
  position: static;
  margin: 20px -10px;
}
</style>

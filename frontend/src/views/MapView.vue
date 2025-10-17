<template>
  <v-overlay :model-value="!mapHelpers.mapLoaded" class="align-center justify-center">
    <v-progress-circular indeterminate :size="128"></v-progress-circular>
  </v-overlay>

  <v-container fluid class="map-view-container">
    <div class="region-selector-container">
      <TheRegionSelector :z-index="999999" />
    </div>
    <div v-if="activeFeature" id="div-plot-button" class="desktop-plot-buttons-container">
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
          <InfoTooltip
            text="Display historical streamflow data for the selected river as a graph, 
            showing hourly values in cubic feet per second (cfs)."
            style="margin-left: 5px"
          />
        </v-btn>
        <v-btn
          style="margin-right: 10px"
          @click="toggle('forecast')"
          :color="showForecast ? 'blue' : 'white'"
        >
          Forecast
          <InfoTooltip
            text="Display forecasted streamflow data for selected river or stream in a graph,
            showing hourly values in cubic feet per second (cfs)."
            style="margin-left: 5px"
          />
        </v-btn>
      </v-card>
    </div>

    <v-row
      :class="{ 'desktop-map-container': !mdAndDown, 'mobile-map-container': mdAndDown }"
    >
      <v-col style="padding: 0px; margin: 0px; position: relative">
        <TheLeafletMap />
      </v-col>
    </v-row>

    <div
      v-if="showStageSlider"
      :class="{
        'desktop-stage-slider-container': !mdAndDown,
        'mobile-stage-slider-container': mdAndDown
      }"
    >
      <TheStageSlider
        v-model="mapHelpers.stageValue.value"
        :min="activeFeatureFimCogData.stages_m[0]"
        :max="activeFeatureFimCogData.stages_m[activeFeatureFimCogData.stages_m.length - 1]"
        :stages="activeFeatureFimCogData.stages_m"
        :flows="activeFeatureFimCogData.flows_cms"
        :width="mdAndDown ? '40px' : '50px'"
        :height="mdAndDown ? '100px' : '400px'"
        @update:modelValue="handleStageChange"
      />
    </div>

    <div
      v-if="showHistorical || showForecast"
      :class="{ 'mobile-plot-container': mdAndDown, 'desktop-plot-container': !mdAndDown }"
    >
      <HistoricalPlot
        v-show="showHistorical"
        ref="historicalPlotRef"
        :reachid="reach_id"
        :reachname="reach_name"
        :style="{ width: '500px', height: '300px', padding: '0px 10px', margin: '10px 0px' }"
        :show="showHistorical"
      />

      <ForecastPlot
        v-show="showForecast"
        ref="forecastPlotRef"
        :reachid="reach_id"
        :reachname="reach_name"
        :forecast_datetime="forecastDateTime"
        :forecast_mode="forecastMode"
        :forecast_ensemble="forecastEnsemble"
        :style="{ width: '500px', height: '300px', padding: '0px 10px', margin: '10px 0px' }"
        :show="showForecast"
      />
    </div>
  </v-container>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { useDisplay } from 'vuetify'
import HistoricalPlot from '@/components/HistoricalPlot.vue'
import ForecastPlot from '@/components/ForecastPlot.vue'
import TheStageSlider from '@/components/TheStageSlider.vue'
import { useFeaturesStore } from '@/stores/features'
import { useAlertStore } from '@/stores/alerts'
import TheLeafletMap from '@/components/TheLeafletMap.vue'
import { storeToRefs } from 'pinia'
import InfoTooltip from '../components/InfoTooltip.vue'
import * as mapHelpers from '@/helpers/map'
import TheRegionSelector from '../components/TheRegionSelector.vue'

const { mdAndDown } = useDisplay()

const featureStore = useFeaturesStore()
const alertStore = useAlertStore()

const showHistorical = ref(false)
const showForecast = ref(false)
const historicalPlotRef = ref(null)
const forecastPlotRef = ref(null)

const { activeFeature } = storeToRefs(featureStore)

const reach_name = ref(null)
const reach_id = ref(null)
const forecastDateTime = ref(new Date(Date.now() - 24 * 60 * 60 * 1000)) // default: yesterday
const forecastMode = ref('medium_range')
const forecastEnsemble = ref('3')

// Watch the COMID from the store. When it changes,
// we will update the data displayed in the timeseries plot
// components.
watch(
  () => activeFeature.value?.properties?.COMID,
  async (newVal, oldVal) => {
    if (newVal !== oldVal) {
      // wait until reactivity has completed so that all
      // variables in the store are available before proceeding.
      //      await nextTick()

      reach_id.value = newVal
      reach_name.value = featureStore.activeFeatureName

      console.log('Active feature COMID changed, setting reach_id to: ', reach_id.value)
      console.log('Active feature Name: ' + reach_name.value)
    }
  }
)

const toggle = async (component_name) => {
  console.log('Toggling: ' + component_name)

  // get the feature id from the active feature
  reach_id.value = activeFeature.value?.properties?.COMID ?? null
  if (reach_id.value === undefined || reach_id.value === null) {
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

  // toggle plot visualizations
  // based on which button was clicked.
  if (component_name === 'historical') {
    showHistorical.value = !showHistorical.value
    await nextTick()
    await historicalPlotRef.value.getHistoricalData(
      reach_id.value.toString(),
      reach_name.value,
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      new Date(Date.now())
    )
  } else if (component_name === 'forecast') {
    showForecast.value = !showForecast.value
    await nextTick()
    await forecastPlotRef.value.getForecastData(
      reach_id.value.toString(),
      reach_name.value,
      forecastDateTime.value,
      forecastMode.value,
      forecastEnsemble.value
    )
  }
}

const activeFeatureFimCogData = computed(() => {
  if (!activeFeature.value || !activeFeature.value.properties) return null
  return activeFeature.value.properties.fimCogData || null
})

const showStageSlider = computed(() => {
  const activeFeatureHasData =
    activeFeatureFimCogData.value && activeFeatureFimCogData.value.stages_m.length > 0
  return activeFeatureHasData && !mapHelpers.layerControlIsExpanded.value
})

const handleStageChange = () => {
  console.log('Stage value changed:', mapHelpers.stageValue.value)
  // enable "snapping to nearest stage" functionality
  // if the stage value is not in the list of stages
  if (!activeFeatureFimCogData.value.stages_m.includes(mapHelpers.stageValue.value)) {
    // find the nearest stage value
    const nearestStage = activeFeatureFimCogData.value.stages_m.reduce((prev, curr) => {
      return Math.abs(curr - mapHelpers.stageValue.value) <
        Math.abs(prev - mapHelpers.stageValue.value)
        ? curr
        : prev
    })
    mapHelpers.stageValue.value = nearestStage
    console.log('Snapped to nearest stage:', nearestStage)
  }
  const cogUrls = mapHelpers.determineCogsForStage(
    activeFeatureFimCogData.value.files,
    activeFeatureFimCogData.value.stages_m
  )
  if (cogUrls.length === 0) {
    alertStore.displayAlert({
      title: 'No Data Available',
      text: `There are no COGs available for the selected stage: ${mapHelpers.stageValue.value}m.`,
      type: 'warning',
      closable: true,
      duration: 5
    })
    return
  }
  mapHelpers.clearCogsFromMap()
  mapHelpers.addCogsToMap(cogUrls)
}
</script>
<style scoped>
.map-view-container {
  position: relative;
  height: 100%;
}

.desktop-map-container {
  height: calc(100vh - 120px);
  position: relative;
}

.desktop-plot-container {
  width: 500px;
  height: calc(100vh - 310px);
  position: fixed;
  top: 250px;
  z-index: 99999;
}

.desktop-plot-buttons-container {
  width: 400px;
  height: 50px;
  position: absolute;
  z-index: 99999;
  transform: translate(0px, 60px);
}

.mobile-map-container {
  height: calc(100vh - 500px);
  min-height: 40vh;
  position: relative;
}

.mobile-plot-container {
  width: 102%;
  position: static;
  margin: 20px -10px;
}

.region-selector-container {
  position: absolute;
  top: 10px;
  left: 15px;
  z-index: 999999; /* Match this with the prop value */
  width: 300px;
}

.desktop-stage-slider-container {
  position: absolute;
  right: 15px;
  top: 475px;
  transform: translateY(-50%);
  z-index: 99999;
  pointer-events: none;
}
.mobile-stage-slider-container {
  position: absolute;
  right: 15px;
  top: 325px;
  transform: translateY(-50%);
  z-index: 99999;
  pointer-events: none;
}

/* Ensure the slider itself has pointer events */
.desktop-stage-slider-container >>> .thermometer-slider-container,
.mobile-stage-slider-container >>> .thermometer-slider-container {
  pointer-events: auto;
}
</style>

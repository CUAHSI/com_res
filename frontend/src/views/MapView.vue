<template>
  <v-overlay :model-value="!mapHelpers.mapLoaded" class="align-center justify-center">
    <v-progress-circular indeterminate :size="128"></v-progress-circular>
  </v-overlay>

  <v-container fluid>
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
          <InfoIcon
            text="Plot historical streamflow data for the selected river reach."
            style="margin-left: 5px"
          />
        </v-btn>
        <v-btn
          style="margin-right: 10px"
          @click="toggle('forecast')"
          :color="showForecast ? 'blue' : 'white'"
        >
          Forecast
          <InfoIcon
            text="Plot forecasted streamflow data for the selected river reach."
            style="margin-left: 5px"
          />
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

    <TheStageSlider
      v-if="activeFeatureFimCogData && activeFeatureFimCogData.stages_m.length > 0"
      v-model="mapHelpers.stageValue.value"
      :min="activeFeatureFimCogData.stages_m[0]"
      :max="activeFeatureFimCogData.stages_m[activeFeatureFimCogData.stages_m.length - 1]"
      :stages="activeFeatureFimCogData.stages_m"
      :flows="activeFeatureFimCogData.flows_cms"
      width="50px"
      height="400px"
      @update:modelValue="handleStageChange"
      style="z-index: 99999"
    />

    <div :class="{ 'mobile-plot-container': mdAndDown, 'desktop-plot-container': !mdAndDown }">
      <HistoricalPlot
        v-show="showHistorical"
        ref="historicalPlotRef"
        :reachid="reach_id"
        :reachname="reach_name"
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
import { ref, watch, computed } from 'vue'
import { useDisplay } from 'vuetify'
import HistoricalPlot from '@/components/HistoricalPlot.vue'
import ForecastPlot from '@/components/ForecastPlot.vue'
import TheStageSlider from '@/components/TheStageSlider.vue'
import { useFeaturesStore } from '@/stores/features'
import { useAlertStore } from '@/stores/alerts'
import TheLeafletMap from '@/components/TheLeafletMap.vue'
import { storeToRefs } from 'pinia'
import InfoIcon from '../components/InfoTooltip.vue'
import * as mapHelpers from '@/helpers/map'

const { mdAndDown } = useDisplay()

const featureStore = useFeaturesStore()
const alertStore = useAlertStore()

const showHistorical = ref(false)
const showForecast = ref(false)
const historicalPlotRef = ref(null)
const forecastPlotRef = ref(null)

const { activeFeature, getFeatureName } = storeToRefs(featureStore)

const reach_name = ref(null)
const reach_id = ref(null)

// Watch the COMID from the store. When it changes,
// we will update the data displayed in the timeseries plot
// components.
watch(
  () => activeFeature.value?.properties?.COMID,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      reach_id.value = newVal
      console.log('Active feature COMID changed, setting reach_id to: ', reach_id.value)

      // when the COMID changes, so does the reach name
      console.log('Feature Name: ' + getFeatureName)
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
  reach_name.value =
    activeFeature.value?.properties.PopupTitle || activeFeature.properties.REACHCODE

  // toggle plot visualizations
  // based on which button was clicked.
  if (component_name === 'historical') {
    showHistorical.value = !showHistorical.value
    //    await historicalPlotRef.value.getHistoricalData(
    //      reach_id.toString(),
    //      reach_name,
    //      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    //      new Date(Date.now())
    //    )
  } else if (component_name === 'forecast') {
    showForecast.value = !showForecast.value
    await forecastPlotRef.value.getForecastData(
      reach_id.value.toString(),
      reach_name,
      new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      'medium_range',
      '3'
    )
  }
}

const activeFeatureFimCogData = computed(() => {
  if (!activeFeature.value || !activeFeature.value.properties) return null
  return activeFeature.value.properties.fimCogData || null
})

const handleStageChange = () => {
  console.log('Stage value changed:', mapHelpers.stageValue.value)
  // enable "snapping to nearest stage" functionality
  // if the stage value is not in the list of stages
  if (!activeFeatureFimCogData.value.stages_m.includes(mapHelpers.stageValue.value)) {
    // find the nearest stage value
    const nearestStage = activeFeatureFimCogData.value.stages_m.reduce((prev, curr) => {
      return Math.abs(curr - mapHelpers.stageValue.value) < Math.abs(prev - mapHelpers.stageValue.value) ? curr : prev
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

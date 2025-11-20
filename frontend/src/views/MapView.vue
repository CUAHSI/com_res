<template>
  <v-overlay :model-value="!mapHelpers.mapLoaded" class="align-center justify-center">
    <v-progress-circular indeterminate :size="128" />
  </v-overlay>

  <v-container fluid class="map-view-container">
    <!-- Combined Controls Container -->
    <div :class="mdAndDown ? 'mobile-controls-container' : 'desktop-controls-container'">
      <div class="controls-content">
        <!-- Left Column - Region Selector and Mode Toggle -->
        <div class="left-column">
          <!-- Region Selector -->
          <div class="control-section">
            <TheRegionSelector />
          </div>

          <!-- Multi-reach Mode Toggle -->
          <div class="control-section">
            <v-card variant="flat" class="multi-reach-toggle-card">
              <v-card-title style="font-size: medium; padding: 8px 12px 0px 12px">
                Selection Mode
              </v-card-title>
              <v-radio-group
                v-model="multiReachMode"
                density="compact"
                hide-details
                inline
                style="padding: 0px 12px 8px 12px"
              >
                <v-radio label="Single Reach" :value="false" color="primary" />
                <v-radio label="Multi-reach Mode" :value="true" color="primary">
                  <template #label>
                    <span>Multi-reach</span>
                    <InfoTooltip
                      text="Enable to select multiple river reaches at a time. Use Ctrl (Cmd on Mac) + Click to select additional reaches on the map. Or use the context menu option 'Select Additional Feature'."
                      style="margin-left: 5px"
                      z-index="999999"
                      class="tooltip-icon"
                    />
                  </template>
                </v-radio>
              </v-radio-group>
            </v-card>
          </div>
        </div>

        <!-- Right Column - Action Buttons -->
        <div class="right-column">
          <!-- Action Buttons -->
          <div v-if="activeFeature" class="control-section">
            <v-card variant="flat" class="action-buttons-card">
              <v-btn
                id="btn-show-stage-slider"
                :color="toggledStageSlider ? 'primary' : 'white'"
                class="action-button"
                @click="toggle('stage')"
              >
                Flood Map
                <InfoTooltip
                  text="Toggle flood map visualization for the selected river reach based on stage values."
                  z-index="999999"
                  class="tooltip-icon"
                />
              </v-btn>
              <v-btn
                v-if="!multiReachMode"
                id="btn-show-historical"
                :color="showHistorical ? 'primary' : 'white'"
                class="action-button"
                @click="toggle('historical')"
              >
                Historical
                <InfoTooltip
                  text="Display historical streamflow data for the selected river as a graph, 
                  showing hourly values in cubic feet per second (cfs)."
                  style="margin-left: 5px"
                  z-index="999999"
                  class="tooltip-icon"
                />
              </v-btn>
              <v-btn
                v-if="!multiReachMode"
                :color="showForecast ? 'primary' : 'white'"
                class="action-button"
                @click="toggle('forecast')"
              >
                Forecast
                <InfoTooltip
                  text="Display forecasted streamflow data for selected river or stream in a graph,
                  showing hourly values in cubic feet per second (cfs)."
                  style="margin-left: 5px"
                  class="tooltip-icon"
                />
              </v-btn>
            </v-card>
          </div>
        </div>
      </div>
    </div>

    <v-row :class="{ 'desktop-map-container': !mdAndDown, 'mobile-map-container': mdAndDown }">
      <v-col style="padding: 0px; margin: 0px; position: relative">
        <TheLeafletMap />
      </v-col>
    </v-row>

    <div
      v-if="(showHistorical || showForecast) && !multiReachMode"
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
        :forecast-datetime="forecastDateTime"
        :forecast-mode="forecastMode"
        :forecast-ensemble="forecastEnsemble"
        :style="{ width: '500px', height: '300px', padding: '0px 10px', margin: '10px 0px' }"
        :show="showForecast"
      />
    </div>
    <div v-if="showStageSlider" class="desktop-stage-slider-container">
      <TheStageSlider
        v-model="mapHelpers.stageValue.value"
        :multi-reach-mode="multiReachMode"
        :selected-features="selectedFeatures"
        :active-feature="activeFeature"
        :width="mdAndDown ? '50px' : '60px'"
        :height="mdAndDown ? '100px' : '400px'"
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

const { activeFeature, selectedFeatures, toggledStageSlider, multiReachMode } =
  storeToRefs(featureStore)

const reach_name = ref(null)
const reach_id = ref(null)
const forecastDateTime = ref(new Date(Date.now() - 24 * 60 * 60 * 1000))
const forecastMode = ref('medium_range')
const forecastEnsemble = ref('3')

const showStageSlider = computed(() => {
  // Check if any selected feature has data
  const hasData = selectedFeatures.value.some(
    (feature) => feature.properties?.fimCogData?.stages_ft?.length > 0
  )
  return hasData && !mapHelpers.layerControlIsExpanded.value && toggledStageSlider.value
})

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

      // if the new id is null, clear the plots
      if (reach_id.value === null || reach_id.value === undefined) {
        showHistorical.value = false
        showForecast.value = false
        return
      }

      console.log('Active feature COMID changed, setting reach_id to: ', reach_id.value)
      console.log('Active feature Name: ' + reach_name.value)
    }
  }
)

const trackHeapEvent = (eventName, properties = {}) => {
  try {
    if (typeof window !== 'undefined' && window.heap && typeof window.heap.track === 'function') {
      window.heap.track(eventName, properties)
    } else {
      console.debug('Heap not available, event not sent:', eventName, properties)
    }
  } catch (error) {
    console.error('Error tracking event:', error)
  }
}
// Watch multi-reach mode changes
watch(multiReachMode, (newValue) => {
  console.log('Multi-reach mode changed to:', newValue)
  if (!newValue && selectedFeatures.value.length > 1) {
    // If switching back to single mode with multiple selections,
    // keep only the last selected feature
    const lastFeature = selectedFeatures.value[selectedFeatures.value.length - 1]
    featureStore.clearSelectedFeatures()
    featureStore.selectFeature(lastFeature)
  }
})

const toggle = async (component_name) => {
  trackHeapEvent(
    component_name === 'historical' ? 'Historical Button Click' : 'Forecast Button Click',
    {
      hasActiveFeature: !!activeFeature.value,
      reachId: activeFeature.value?.properties?.COMID ?? null,
      reachName: featureStore.activeFeatureName ?? null
    }
  )

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
  } else if (component_name === 'stage') {
    // stage slider toggle
    if (toggledStageSlider.value) {
      toggledStageSlider.value = false
      mapHelpers.clearCogsFromMap()
    } else {
      toggledStageSlider.value = true
    }
  }
}
</script>
<style scoped>
.map-view-container {
  position: relative;
  height: 100%;
}

/* Combined Controls Container */
.desktop-controls-container {
  position: absolute;
  top: 10px;
  left: 15px;
  z-index: var(--z-index-map-controls);
  width: 500px; /* Increased width to accommodate two columns */
}

.mobile-controls-container {
  position: absolute;
  top: 10px;
  left: 15px;
  z-index: var(--z-index-map-controls);
  width: 200px;
}

/* Desktop: Two-column layout */
.desktop-controls-container .controls-content {
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: flex-start;
}

.desktop-controls-container .left-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0; /* Prevent flex item from overflowing */
}

.desktop-controls-container .right-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0; /* Prevent flex item from overflowing */
}

/* Mobile: Single column layout */
.mobile-controls-container .controls-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-section {
  width: 100%;
  min-height: fit-content;
}

/* Multi-reach toggle card */
.multi-reach-toggle-card {
  background-color: rgba(255, 255, 255, 0.9) !important;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  width: 100%;
  position: relative;
}

/* Action buttons card */
.action-buttons-card {
  background-color: transparent !important;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  position: relative;
}

.action-button {
  width: 100%;
  justify-content: start;
  padding-left: 12px;
}

.desktop-map-container {
  height: calc(100vh - 120px);
  position: relative;
}

.desktop-plot-container {
  width: 500px;
  height: calc(100vh - 270px);
  position: fixed;
  top: 280px;
  z-index: var(--z-index-plots);
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

.desktop-stage-slider-container {
  position: absolute;
  right: 15px;
  top: 230px;
  z-index: var(--z-index-map-controls);
  pointer-events: none;
}

/* Ensure the slider itself has pointer events */
.desktop-stage-slider-container >>> .thermometer-slider-container {
  pointer-events: auto;
}

/* Action buttons with right-aligned tooltips */
.action-button {
  width: 100%;
  justify-content: space-between !important; /* This pushes text left and icon right */
  padding: 0 12px !important;
  position: relative;
}

.button-text {
  flex: 1;
  text-align: left;
}

.tooltip-icon {
  margin-left: auto; /* Push tooltip to the right */
  flex-shrink: 0; /* Prevent tooltip from shrinking */
}
</style>

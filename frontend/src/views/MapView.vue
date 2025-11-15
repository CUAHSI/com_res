<template>
  <v-overlay :model-value="!mapHelpers.mapLoaded" class="align-center justify-center">
    <v-progress-circular indeterminate :size="128"></v-progress-circular>
  </v-overlay>

  <v-container fluid class="map-view-container">
    <!-- Combined Controls Container -->
    <div :class="mdAndDown ? 'mobile-controls-container' : 'desktop-controls-container'">
      <div class="controls-content">
        <!-- Left Column - Region Selector and Mode Toggle -->
        <div class="left-column">
          <!-- Region Selector -->
          <div class="control-section">
            <TheRegionSelector :z-index="999999" />
          </div>

          <!-- Multi-reach Mode Toggle -->
          <div class="control-section">
            <v-card
              variant="flat"
              class="multi-reach-toggle-card"
            >
              <v-card-title style="font-size: medium; padding: 8px 12px 0px 12px;">Selection Mode</v-card-title>
              <v-radio-group
                v-model="multiReachMode"
                density="compact"
                hide-details
                inline
                style="padding: 0px 12px 8px 12px;"
              >
                <v-radio
                  label="Single Reach"
                  :value="false"
                  color="primary"
                ></v-radio>
                <v-radio
                  label="Multi-reach Mode"
                  :value="true"
                  color="primary"
                >
                  <template v-slot:label>
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
            <v-card
              variant="flat"
              class="action-buttons-card"
            >
              <v-btn
                id="btn-show-stage-slider"
                @click="toggle('stage')"
                :color="toggledStageSlider ? 'primary' : 'white'"
                class="action-button"
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
                @click="toggle('historical')"
                :color="showHistorical ? 'primary' : 'white'"
                class="action-button"
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
                @click="toggle('forecast')"
                :color="showForecast ? 'primary' : 'white'"
                class="action-button"
              >
                Forecast
                <InfoTooltip
                  text="Display forecasted streamflow data for selected river or stream in a graph,
                  showing hourly values in cubic feet per second (cfs)."
                  style="margin-left: 5px"
                  z-index="999999"
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
        :forecast_datetime="forecastDateTime"
        :forecast_mode="forecastMode"
        :forecast_ensemble="forecastEnsemble"
        :style="{ width: '500px', height: '300px', padding: '0px 10px', margin: '10px 0px' }"
        :show="showForecast"
      />
    </div>
    <div
      v-if="showStageSlider"
      class='desktop-stage-slider-container'
    >
      <TheStageSlider
        v-model="mapHelpers.stageValue.value"
        min="0"
        :max="multiReachMode && multiReachStageData ? multiReachStageData.max : activeFeatureFimCogData.stages_m[activeFeatureFimCogData.stages_m.length - 1]"
        :stages="multiReachMode && multiReachStageData ? multiReachStageData.stages_m : activeFeatureFimCogData.stages_m"
        :flows="activeFeatureFimCogData.flows_cms"
        :width="mdAndDown ? '50px' : '60px'"
        :height="mdAndDown ? '100px' : '400px'"
        @update:modelValue="handleStageChange"
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

const { activeFeature, selectedFeatures, toggledStageSlider, multiReachMode } = storeToRefs(featureStore)

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
      handleStageChange()
    }
  }
}

const activeFeatureFimCogData = computed(() => {
  if (!activeFeature.value || !activeFeature.value.properties) return null
  return activeFeature.value.properties.fimCogData || null
})

// New computed property for multi-reach stage data
const multiReachStageData = computed(() => {
  if (selectedFeatures.value.length === 0) return null
  
  // Collect all fimCogData from selected features
  const allFimCogData = selectedFeatures.value
    .map(feature => feature.properties?.fimCogData)
    .filter(data => data && data.stages_m && data.stages_m.length > 0)
  
  if (allFimCogData.length === 0) return null
  
  // Find the minimum of all maximum stage values
  const maxStages = allFimCogData.map(data => 
    data.stages_m[data.stages_m.length - 1]
  )
  const minMaxStage = Math.min(...maxStages)
  
  // Find the maximum of all minimum stage values
  const minStages = allFimCogData.map(data => data.stages_m[0])
  const maxMinStage = Math.max(...minStages)
  
  // Get all unique stages within the common range
  const allStages = Array.from(
    new Set(
      allFimCogData.flatMap(data => 
        data.stages_m.filter(stage => 
          stage >= maxMinStage && stage <= minMaxStage
        )
      )
    )
  ).sort((a, b) => a - b)
  
  return {
    stages_m: allStages,
    min: maxMinStage,
    max: minMaxStage,
    allFimCogData: allFimCogData
  }
})

const showStageSlider = computed(() => {
  // Check if any selected feature has data
  const hasData = selectedFeatures.value.some(feature => 
    feature.properties?.fimCogData?.stages_m?.length > 0
  )
  return hasData && !mapHelpers.layerControlIsExpanded.value && toggledStageSlider.value
})

const handleStageChange = () => {
  console.log('Stage value changed:', mapHelpers.stageValue.value)
  mapHelpers.clearCogsFromMap()
  let addedCogs = false
  
  // Get the features to process based on mode
  const featuresToProcess = multiReachMode.value ? selectedFeatures.value : [activeFeature.value]
  
  for (const feature of featuresToProcess) {
    if (!feature?.properties?.fimCogData) continue
    
    console.log('Processing feature for COGs:', feature)
    const fimCogData = feature.properties.fimCogData
    console.log('FIM COG Data:', fimCogData)
    
    if (fimCogData) {
      // In multi-reach mode, use the common stages range
      let targetStage = mapHelpers.stageValue.value
      
      if (multiReachMode.value && multiReachStageData.value) {
        // Ensure the stage is within the common range and snap if needed
        if (!multiReachStageData.value.stages_m.includes(targetStage)) {
          const nearestStage = multiReachStageData.value.stages_m.reduce((prev, curr) => {
            return Math.abs(curr - targetStage) < Math.abs(prev - targetStage)
              ? curr
              : prev
          })
          targetStage = nearestStage
          console.log('Snapped to nearest common stage:', nearestStage)
        }
      } else {
        // Single reach mode - use original snapping logic
        if (!fimCogData.stages_m.includes(targetStage)) {
          const nearestStage = fimCogData.stages_m.reduce((prev, curr) => {
            return Math.abs(curr - targetStage) < Math.abs(prev - targetStage)
              ? curr
              : prev
          })
          targetStage = nearestStage
          console.log('Snapped to nearest stage:', nearestStage)
        }
      }
      
      // Update the stage value if it was snapped
      if (targetStage !== mapHelpers.stageValue.value) {
        mapHelpers.stageValue.value = targetStage
      }
      
      const cogUrls = mapHelpers.determineCogsForStage(
        fimCogData.files,
        fimCogData.stages_m
      )
      if (cogUrls.length > 0) {
        addedCogs = true
        mapHelpers.addCogsToMap(cogUrls)
      }
    }
  }
  
  if (!addedCogs) {
    alertStore.displayAlert({
      title: 'No Data Available',
      text: `There are no COGs available for the selected stage: ${mapHelpers.stageValue.value}m.`,
      type: 'warning',
      closable: true,
      duration: 5
    })
    return
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
  z-index: 999999;
  width: 500px; /* Increased width to accommodate two columns */
}

.mobile-controls-container {
  position: absolute;
  top: 10px;
  left: 15px;
  z-index: 999999;
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
  z-index: 99999;
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
  z-index: 99999;
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
<template>
  <v-overlay :model-value="!mapHelpers.mapLoaded" class="align-center justify-center">
    <v-progress-circular indeterminate :size="128" />
  </v-overlay>

  <v-container fluid class="map-view-container">
    <v-navigation-drawer
      v-model="drawerOpen"
      location="left"
      :width="drawerWidth"
      class="controls-drawer"
      temporary
      :scrim="xs"
    >
      <v-card flat class="drawer-content">
        <v-card-title class="drawer-title"> Controls </v-card-title>

        <div class="drawer-section">
          <TheRegionSelector />
        </div>

        <div class="drawer-section">
          <v-card variant="flat" class="multi-reach-toggle-card">
            <v-card-title class="section-title"> Selection Mode </v-card-title>
            <v-radio-group
              v-model="multiReachMode"
              density="compact"
              hide-details
              class="radio-group"
            >
              <v-radio label="Single Reach" :value="false" color="primary" />
              <v-radio label="Multi-reach Mode" :value="true" color="primary">
                <template #label>
                  <span>Multi-reach</span>
                  <InfoTooltip
                    text="Enable to select multiple river reaches at a time. Use Ctrl (Cmd on Mac) + Click to select additional reaches on the map."
                    class="tooltip-icon"
                  />
                </template>
              </v-radio>
            </v-radio-group>
          </v-card>
        </div>
      </v-card>
    </v-navigation-drawer>

    <div class="map-shell" :class="{ 'mobile-map-shell': xs }">
      <TheLeafletMap />

      <div v-if="hasSelection" class="floating-actions" :class="{ 'floating-actions-mobile': xs }">
        <div class="left-icons">
          <v-btn
            icon
            size="small"
            :color="showHistorical ? 'primary' : 'white'"
            class="action-icon"
            :disabled="multiReachMode"
            @click="toggle('historical')"
          >
            <v-icon :icon="mdiChartLine" />
            <v-tooltip activator="parent" location="top"> Historical Data </v-tooltip>
          </v-btn>

          <v-btn
            icon
            size="small"
            :color="showForecast ? 'primary' : 'white'"
            class="action-icon"
            :disabled="multiReachMode"
            @click="toggle('forecast')"
          >
            <v-icon :icon="mdiWeatherCloudy" />
            <v-tooltip activator="parent" location="top"> Forecast Data </v-tooltip>
          </v-btn>
        </div>

        <div class="right-icons">
          <v-btn
            icon
            size="small"
            :color="toggledStageSlider ? 'primary' : 'white'"
            class="action-icon"
            @click="toggle('stage')"
          >
            <v-icon :icon="mdiWaves" />
            <v-tooltip activator="parent" location="top"> Flood Map </v-tooltip>
          </v-btn>
        </div>
      </div>

      <div
        v-if="showStageSlider"
        class="stage-slider-container"
        :class="{ 'mobile-stage-slider': xs }"
      >
        <TheStageSlider
          v-model="mapHelpers.stageValue.value"
          :multi-reach-mode="multiReachMode"
          :selected-features="selectedFeatures"
          :active-feature="activeFeature"
          :width="sliderWidth"
          :height="sliderHeight"
        />
      </div>

      <v-btn
        icon
        class="drawer-toggle"
        :class="{ 'drawer-toggle-mobile': xs }"
        @click="drawerOpen = !drawerOpen"
      >
        <v-icon :icon="mdiMenu" />
        <v-tooltip activator="parent" location="right"> Toggle Controls </v-tooltip>
      </v-btn>
    </div>

    <div v-if="(showHistorical || showForecast) && !multiReachMode" class="plot-container">
      <HistoricalPlot
        v-show="showHistorical"
        ref="historicalPlotRef"
        :reachid="reach_id"
        :reachname="reach_name"
        :style="plotStyle"
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
        :style="plotStyle"
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
import { mdiMenu, mdiChartLine, mdiWeatherCloudy, mdiWaves } from '@mdi/js'

const { xs, sm } = useDisplay()

const featureStore = useFeaturesStore()
const alertStore = useAlertStore()

const showHistorical = ref(false)
const showForecast = ref(false)
const historicalPlotRef = ref(null)
const forecastPlotRef = ref(null)
const drawerOpen = ref(false)

const { activeFeature, selectedFeatures, toggledStageSlider, multiReachMode } =
  storeToRefs(featureStore)

const reach_name = ref(null)
const reach_id = ref(null)
const forecastDateTime = ref(new Date(Date.now() - 24 * 60 * 60 * 1000))
const forecastMode = ref('medium_range')
const forecastEnsemble = ref('3')

const drawerWidth = computed(() => (xs.value ? 300 : 340))

const hasSelection = computed(() => !!activeFeature.value || selectedFeatures.value.length > 0)

const plotStyle = computed(() => {
  const base = {
    width: '100%',
    padding: '10px',
    margin: '10px 0'
  }
  if (xs.value) {
    return { ...base, height: '260px' }
  }
  if (sm.value) {
    return { ...base, height: '300px' }
  }
  return { ...base, height: '340px' }
})

const sliderWidth = computed(() => {
  if (xs.value) return '48px'
  if (sm.value) return '54px'
  return '64px'
})

const sliderHeight = computed(() => {
  if (xs.value) return '170px'
  if (sm.value) return '240px'
  return '360px'
})

const showStageSlider = computed(() => {
  const hasData = selectedFeatures.value.some(
    (feature) => feature.properties?.fimCogData?.stages_ft?.length > 0
  )
  return hasData && !mapHelpers.layerControlIsExpanded.value && toggledStageSlider.value
})

// Watch the COMID from the store
watch(
  () => activeFeature.value?.properties?.COMID,
  async (newVal, oldVal) => {
    if (newVal !== oldVal) {
      reach_id.value = newVal
      reach_name.value = featureStore.activeFeatureName

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

  reach_id.value = activeFeature.value?.properties?.COMID ?? null
  if (reach_id.value === undefined || reach_id.value === null) {
    alertStore.displayAlert({
      title: 'No River Reach Selected',
      text: 'You must select a river reach on the map to view historical streamflow data.',
      type: 'error',
      closable: true,
      duration: 5
    })
    return
  }

  if (component_name === 'historical') {
    showHistorical.value = !showHistorical.value
    await nextTick()
    await historicalPlotRef.value.getHistoricalData(
      reach_id.value.toString(),
      reach_name.value,
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
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
  min-height: 100vh;
  padding: 0;
}

.map-shell {
  position: relative;
  height: 70vh;
  min-height: 60vh;
  width: 100%;
  background: #f7f9fb;
}

.mobile-map-shell {
  min-height: 65vh;
}

/* Navigation Drawer Styles */
.controls-drawer {
  z-index: 1005;
}

.drawer-content {
  height: 100%;
  padding: 16px;
}

.drawer-title {
  font-size: 1.2rem;
  font-weight: bold;
  padding: 0 0 16px 0;
}

.drawer-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 1rem;
  padding: 8px 0;
}

.radio-group {
  padding: 0 8px 8px 8px;
}

.multi-reach-toggle-card {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.floating-actions {
  position: absolute;
  bottom: 14px;
  left: 14px;
  right: 14px;
  z-index: 2000;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  pointer-events: none;
}

.floating-actions-mobile {
  bottom: 10px;
  left: 10px;
  right: 10px;
}

.left-icons,
.right-icons {
  display: flex;
  gap: 8px;
  pointer-events: auto;
}

.action-icon {
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
}

/* Drawer Toggle Button */
.drawer-toggle {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 1100;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.drawer-toggle-mobile {
  top: 10px;
  left: 10px;
}

/* Plot Container - Always below map */
.plot-container {
  width: 100%;
  background-color: white;
  border-top: 1px solid #e0e0e0;
  padding: 8px 12px 16px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

/* Stage Slider - Over the map */
.stage-slider-container {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1100;
  pointer-events: none;
}

.mobile-stage-slider {
  right: 8px;
  top: 52%;
}

.stage-slider-container >>> .slider-wrapper {
  pointer-events: auto;
  max-width: 110px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .map-shell {
    height: 70vh;
    min-height: 60vh;
  }

  .floating-actions {
    bottom: 10px;
    left: 10px;
    right: 10px;
    gap: 8px;
  }
}

@media (min-width: 601px) and (max-width: 960px) {
  .stage-slider-container {
    right: 14px;
  }
}
</style>

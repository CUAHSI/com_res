<template>
  <v-container class="resources">
    <v-sheet class="pa-6 mx-auto" max-width="1200" rounded>
      <h3 class="ma-2">How do I use FloodSavvy?</h3>
      <p style="padding: 12px 16px 12px 24px; padding: 12px 16px">
        To help guide you through FloodSavvy’s key capabilities, here are some scenario-based
        exercises related to water-related decision-making and community resilience planning. It is
        recommended that you duplicate the browser so that you can view the scenario instructions
        whilst using the FloodSavvy resource.
      </p>

      <h4 class="ma-2" style="color: gray; font-style: italic">
        Scenario 1: Using historical forecast data to evaluate past flood events
      </h4>
      <v-sheet
        class="mt-2 mb-4 pa-4"
        style="background-color: #f0f0f0; border-left: 4px solid #9e9e9e"
        elevation="0"
        rounded
      >
        <p>
          <strong>Description</strong>: As a floodplain manager for a mid-sized municipality, you
          are working on updating your city’s flood hazard mitigation plan. Your team wants to
          better understand how recent flood events have evolved and identify areas that were
          historically most impacted.
        </p>
        <p>
          <strong>Your Task</strong>:
          <ui>
            <li>
              Select a region of interest from the HOME page or locate the region on the MAPS page.
            </li>
            <li>
              Click the icon with three stacked layers at the top right of the map to open the map
              layers menu. Select your preferred basemap.
              <ul
                class="ma-2"
                style="padding-left: 4rem; border-radius: 12px; margin: 0; font-size: 0.875rem"
              >
                <li>
                  <strong>ESRI World Imagery</strong> displays high-resolution satellite imagery,
                  which is useful for visually identifying landmarks and natural features.
                </li>
                <li>
                  <strong>USGS Imagery</strong> offers detailed topographic information that helps
                  in interpreting terrain in flood-prone areas.
                </li>
                <li>
                  <strong>CartoDB Positron</strong> provides a cleaner, less detailed background,
                  ideal for users who prefer a minimal map to focus solely on the flood extent.
                </li>
                <em>
                  <strong style="color: gray">Note</strong>: For best performance, we recommend
                  using “ESRI World Imagery” as the basemap. As of August 2025, selecting “USGS
                  Imagery” may cause flood maps to not display properly.
                </em>
              </ul>
            </li>
            <li>
              Zoom in to find a river location of interest (represented by blue lines on the map).
              Click on a river to select it. You will see some information pop up including the
              name, river ID, etc., of the selected river.
            </li>
            <li>
              Use the <strong>Historical Data</strong> feature (button found at the top left of the
              page) to visualize the historical streamflow time-series for a location of interest.
              You will see a graph pop up showing streamflow (in cubic feet per second) over time
              (by default up to 90 days in the past).
            </li>
            <li>
              To display historical streamflow data for a specific event in the location of
              interest, click on the date selector icon on the top right of the graph. Select the
              desired date range.
              <ul
                class="ma-2"
                style="padding-left: 4rem; border-radius: 12px; margin: 0; font-size: 0.875rem"
              >
                <em>
                  <strong style="color: gray">Note</strong>: Historical near-real-time streamflow
                  data has been available since 2016, the year the National Water Model (NWM) became
                  operational.
                </em>
              </ul>
            </li>
            <li>
              If flood maps are available for the selected river, a vertical slider will appear on
              the right side of the page. This slider allows you to explore flood scenarios under
              different streamflow conditions. As you move the slider, the corresponding
              pre-computed flood extents will display on the map, indicating areas of possible
              inundation.
              <ul
                class="ma-2"
                style="padding-left: 4rem; border-radius: 12px; margin: 0; font-size: 0.875rem"
              >
                <em>
                  <strong style="color: gray">Note</strong>: These maps are pre-generated for a set
                  of representative conditions, so the one displayed may not match the exact
                  streamflow or stage value you are interested in, but it will reflect the closest
                  available condition.
                </em>
              </ul>
            </li>
            <li>
              Cross-reference this information with flood stage threshold (minor/moderate/severe)
              data available on the NWM. The NWPS/NWM tutorial below provides steps on how to access
              this information.
            </li>
            <li>
              Evaluate whether this tool provides sufficient detail to identify vulnerable areas and
              support future planning decisions around flood mitigation.
            </li>
          </ui>
        </p>
      </v-sheet>

      <h4 class="ma-2" style="color: gray; font-style: italic">
        Scenario 2: Designing a flood resilience plan with combined data sources
      </h4>
      <v-sheet
        class="mt-2 mb-4 pa-4"
        style="background-color: #f0f0f0; border-left: 4px solid #9e9e9e"
        elevation="0"
        rounded
      >
        <p>
          <strong>Description</strong>: You are part of a watershed alliance working on a community
          resilience grant. Your plan includes both an analysis of historical flood exposure and
          projected risks from future storms, with the intention of prioritizing vulnerable
          communities.
        </p>
        <p>
          <strong>Your Task</strong>:
          <ui>
            <li>
              After selecting your region from the HOME page or locating it on the MAPS page, zoom
              in to find a river of interest. Click the river to select it.
            </li>
            <li>
              Use the <strong>Forecast Data</strong> feature (button found at the top left of the
              page) to view projected streamflow for the river.
              <ul
                class="ma-2"
                style="padding-left: 4rem; border-radius: 12px; margin: 0; font-size: 0.875rem"
              >
                <em>
                  <strong style="color: gray">Note</strong>: The forecast data is based on model
                  runs where the NWM is executed six times using nearly identical starting
                  conditions, with slight variations introduced to account for uncertainty in the
                  modeling process. These runs produce six different forecast outputs, known as
                  ensemble members. In this version, we are only showing results from the
                  <span style="text-decoration: underline">first member</span>, which provides
                  hourly forecasts from now through the
                  <span style="text-decoration: underline">next 10 days</span>. In future updates,
                  we plan to include all six types of forecasts to illustrate how uncertainty can
                  evolve over time and how similar or different the outcomes may be.
                  <strong
                    >This will help emphasize the importance of producing reliable forecasts, not
                    just accurate ones</strong
                  >.
                </em>
              </ul>
            </li>
            <li>
              Similar to Scenario 1, use the Historical Data feature, in combination with the flood
              map viewer, to explore where previous flooding may have occurred.
            </li>
            <li>
              Consider social vulnerability layers (if any; for example the Roaring River State Park
              boundary), or assess what types of infrastructure might be at risk, in areas that
              consistently show up as flooded.
            </li>
            <li>
              Evaluate the tool’s usefulness for stakeholder collaboration (e.g., presenting to a
              city council or public meeting).
            </li>
          </ui>
        </p>
      </v-sheet>

      <p style="padding: 12px 16px 12px 24px; padding: 12px 16px">
        If you still have questions about FloodSavvy, please reach out to one of our team members on
        the
        <router-link to="/contact">CONTACT US</router-link> page.
      </p>

      <h3 class="ma-2">
        Want to learn more about the six communities who helped develop FloodSavvy and how they are
        using the tool in their work?
      </h3>
      <p style="padding: 12px 16px 12px 24px; padding: 12px 16px">
        Please check back in Fall 2025 for links to community use-case narratives.
      </p>

      <h3 class="ma-2">
        I’m not from one of the six communities serviced by FloodSavvy. Where can I find similar
        information?
      </h3>
      <p style="padding: 12px 16px 12px 24px; padding: 12px 16px">
        The National Water Prediction Service (NWPS) hosts the National Water Model (NWM) and offers
        valuable information for all U.S. communities. We have created the following tutorial to
        help orient you to the NWPS landing page and navigate to the information you might need:
        <a :href="NWM_TUTORIAL" target="_blank" rel="noopener"> National Water Model Tutorial </a>
      </p>

      <h3 class="ma-2">Where can I learn more about the NWM or other NOAA resources?</h3>
      <p style="padding: 12px 16px 12px 24px; padding: 12px 16px">
        For more information on how to use the National Water Prediction Service interface, access
        National Water Model data, or other NOAA resources, please view these additional guides
        below:
      </p>

      <v-sheet
        class="mt-2 mb-4 pa-4"
        style="background-color: #f0f0f0; border-left: 4px solid #9e9e9e"
        elevation="0"
        rounded
      >
        <ul class="default-font-style" style="padding-left: 4rem; border-radius: 12px; margin: 0">
          <li>
            <a href="http://water.noaa.gov" target="_blank" rel="noopener">
              National Water Prediction Service
            </a>
          </li>
          <li>
            <a
              href="https://storymaps.arcgis.com/stories/fce72e9168a7402dbfc49fc5b49cee2e"
              target="_blank"
              rel="noopener"
            >
              User's Guide to the National Water Prediction Service (NWPS)
            </a>
          </li>
          <li>
            <a
              href="https://www.weather.gov/media/wrn/Water-Resources-Factsheet.pdf"
              target="_blank"
              rel="noopener"
            >
              Introducing the New National Water Prediction Service (NWPS)
            </a>
          </li>
          <li>
            <a href="http://viewer.weather.noaa.gov" target="_blank" rel="noopener">
              NWS National GIS Map Viewer
            </a>
          </li>
          <li>
            <a href="https://www.weather.gov/owp/operations" target="_blank" rel="noopener">
              NWS Products and Services
            </a>
          </li>
          <li>
            <a
              href="https://storymaps.arcgis.com/stories/c7ae8422207241b5873fff38a22cf66b"
              target="_blank"
              rel="noopener"
            >
              NWS Flood Inundation Mapping Services
            </a>
          </li>
          <li>
            <a
              href="https://storymaps.arcgis.com/stories/c4964f08ffcf4d9286bd1fd545ddfbab"
              target="_blank"
              rel="noopener"
            >
              Using the National Water Model within NWPS
            </a>
          </li>
          <li>
            <a
              href="https://floodready.vermont.gov/news/reading-river-forecast-john-goff-nws-burlington-71824"
              target="_blank"
              rel="noopener"
            >
              Reading the River Forecast, a recording of John Goff, Senior Service Hydrologist with
              NOAA/NWS in Burlington, VT hosted by Flood Ready Vermont.
            </a>
          </li>
        </ul>
      </v-sheet>
    </v-sheet>
  </v-container>
</template>
<script setup>
import NWM_TUTORIAL from '@/assets/NWM_Tutorial_v3.pdf'
</script>

<template>
  <section id="tutorial" class="py-12">
    <v-container>
      <v-row>
        <!-- Left column: Table of Contents -->
        <v-col cols="12" md="3" class="toc-sticky">
          <TableOfContents :toc-items="tocItems" :scroll-handler="scrollToSection" />
        </v-col>

        <!-- Right column: Main Content -->
        <v-col cols="12" md="9">
          
          <!-- Header -->
          <div class="text-left mb-12" id="pdf-guide">
            <h3 class="ma-2">National Water Model Tutorial: 101 Users Guide</h3>
            <p class="paragraph">
              FloodSavvy was designed as a simple, easy-to-use platform that helps 
              communities access the complex hydrological data from NOAA’s National 
              Water Model (NWM). Currently, FloodSavvy covers the geographies of the 
              six communities that helped co-develop it. If your community is not 
              covered by FloodSavvy—or if you’d like to explore the NWM more 
              broadly—we recommend checking out our NWM Tutorial below.The tutorial introduces the National Water Model, explains its data sources, 
                  and highlights the kinds of flooding-related questions it can help answer. 
                  It also walks you through how to:
            </p>
            <div>
                <ul class="custom-bullet-list">
                  <li>
                    Navigate the National Weather Prediction Service website 
                    <span class="note">(where NWM data is available)</span>
                  </li>
                  <li>
                    View and understand streamflow for both gauged and ungauged streams
                  </li>
                  <li>
                    Activate and explore the Flood Inundation Map
                  </li>
                </ul>
              </div>
          </div>

          <!-- PDF Tutorial -->
          <v-card class="overflow-hidden mb-8">
            <iframe
              :src="pdfUrl + '#page=1'"
              title="Tutorial PDF"
              style="width: 100%; height: 500px; border: none; border-radius: 6px;"
            ></iframe>
            
            <v-card-text>
              
              <div class="d-flex gap-2 mt-3">
                <v-btn variant="outlined" size="small" :href="pdfUrl" target="_blank" rel="noopener noreferrer">
                  Open in Tab
                  <v-icon end icon="mdi-open-in-new" size="16" />
                </v-btn>
                <v-btn variant="outlined" size="small" :href="pdfUrl" download>
                  Download
                  <v-icon end icon="mdi-download" size="16" />
                </v-btn>
              </div>
            </v-card-text>
          </v-card>

          <!-- Video Walkthrough -->
          <div class="text-left mb-12" id="video">
            <h3 class="ma-2">Quick Start Video</h3>
            <p class="paragraph">
              Watch this quick video walkthrough to complement the PDF guide and 
              get familiar with the NWPS interface.
            </p>
          </div>

          <v-card class="overflow-hidden mb-8">
            <iframe
              width="100%"
              height="400"
              src="https://www.youtube.com/embed/bdXhQ4JRI88?si=O1Vx7WqEi-aCsJQv"
              title="YouTube Video Player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              style="border-radius: 6px;"
            ></iframe>
            <v-card-text>
              <p class="paragraph">Watch the walkthrough video of the tutorial above.</p>
            </v-card-text>
          </v-card>

          <!-- Additional Resources -->
          <div class="text-left mb-12" id="resources">
            <h3 class="ma-2">Where can I learn more about the NWM and other NOAA resources?</h3>
            <p class="paragraph">
              For more information on using the National Water Prediction Service, 
              accessing NWM data, or exploring NOAA resources, visit the links below:
            </p>
          </div>

          <v-sheet
            class="pa-4 resource-box mb-8"
            elevation="0"
            rounded
          >
            <ul>
              <li v-for="(resource, i) in resources" :key="i">
                <a :href="resource.link" target="_blank" rel="noopener">
                  {{ resource.title }}
                </a>
              </li>
            </ul>
          </v-sheet>

          <!-- Glossary section -->
          <div class="text-left mb-12 glossary-section" id="glossary">
            <h3 class="ma-2">Glossary of Key Hydrological Terms</h3>
            <v-sheet
              class="pa-4 resource-box"
              elevation="0"
              rounded
            >
              <dl class="glossary">
                <div v-for="(item, i) in glossary" :key="i" class="glossary-item">
                  <dt>{{ item.term }}</dt>
                  <dd>{{ item.definition }}</dd>
                </div>
              </dl>
            </v-sheet>
          </div>

        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<script setup>
import pdfFile from "@/assets/NWM_Tutorial_1020.pdf";
import TableOfContents from "@/components/TableOfContents.vue";

const pdfUrl = pdfFile;

const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
};

const resources = [
  { title: "National Water Prediction Service Product and Users Guide", link: "http://water.noaa.gov" },
  { title: "User's Guide to the National Water Prediction Service (NWPS)", link: "https://storymaps.arcgis.com/stories/fce72e9168a7402dbfc49fc5b49cee2e" },
  { title: "Introducing the New National Water Prediction Service (NWPS)", link: "https://www.weather.gov/media/wrn/Water-Resources-Factsheet.pdf" },
  { title: "NWS National GIS Map Viewer", link: "http://viewer.weather.noaa.gov" },
  { title: "NWS Products and Services", link: "https://www.weather.gov/owp/operations" },
  { title: "NWS Flood Inundation Mapping Services", link: "https://storymaps.arcgis.com/stories/c7ae8422207241b5873fff38a22cf66b" },
  { title: "Using the National Water Model within NWPS", link: "https://storymaps.arcgis.com/stories/c4964f08ffcf4d9286bd1fd545ddfbab" },
  { title: "Reading the River Forecast, a recording of John Goff, Senior Service Hydrologist with NOAA/NWS in Burlington, VT hosted by Flood Ready Vermont", link: "https://floodready.vermont.gov/news/reading-river-forecast-john-goff-nws-burlington-71824" },
  { title: "Flood Inundation Mapping, a recording of John Goff, Senior Service Hydrologist with NOAA/NWS in Burlington, VT hosted by Flood Ready Vermont", link: "https://floodready.vermont.gov/news/drop-discussion-sept-18th-flood-inundation-mapping" }
];

const glossary = [
  { term: "Action Stage", definition: "The level of a rising stream at which communities need to take some type of action to prepare for flooding (determined by the NWS)." },
  { term: "Bankfull", definition: "This is the point at which water begins to flow over the lowest natural banks." },
  { term: "Crest", definition: "The highest stage or level of a flood wave as it passes a certain point." },
  { term: "Cubic Feet per Second (CFS)", definition: "A unit measuring the volume of water flow per second." },
  { term: "Datum", definition: "Arbitrary reference elevation to help calculate stage. Datums differ regionally across the US, but a common datum is mean sea level." },
  { term: "Exceedance Probability", definition: "The likelihood, expressed as a decimal (e.g., 0.01), that a streamflow or stage threshold is equaled or surpassed in a given time period." },
  { term: "HAND Method", definition: "Stands for Height Above Nearest Drainage and is a model based on terrain that estimates inundation using elevation and proximity to streams." },
  { term: "Hydrograph", definition: "A graph displaying river levels over time, which is used for both real-time and historical comparisons." },
  { term: "Low Stage", definition: "Water is low enough to cause disruptions to water supply, commerce and may damage property." },
  { term: "Major Flood Stage", definition: "A flood category that indicates properties, including public utilities like hospitals and schools, may be at risk of extensive flooding. Evacuations may be necessary." },
  { term: "Minor Flood Stage", definition: "A flood category that indicates some private property, roads and park land near rivers or streams may be a risk of flooding." },
  { term: "Moderate Flood Stage", definition: "A flood category that indicates properties and major roadways may be at risk of flooding and evacuations may be necessary." },
  { term: "Return Interval", definition: "Also known as recurrence interval, is an indicator of how frequent a particular hydrological event occurs on average. For example, a 1-in-100 year flood has a 1% chance of occurring every year." },
  { term: "River Reach", definition: "A river reach is a stretch of a stream or river that behaves in a similar way (e.g., flood warning information would be consistent for the entire river reach as streamflow and other characteristics are similar)." },
  { term: "Stage Height", definition: "The height of the water surface above a reference point, usually in feet." },
  { term: "Time-Series Data", definition: "A sequence of data points collected or recorded at successive in time, representing how a particular hydrologic variable changes over time. In hydrology, time series often describe measurements or estimates such as streamflow, precipitation and groundwater levels." },
  { term: "Water Depth", definition: "Water depth is the height of the water from the surface to the river bed. As the river bed is uneven and fluctuates often, it is challenging to have a consistent measurement of water depth which is why stages and datums are used." },
];

const tocItems = [
  { id: "pdf-guide", title: "101 Users Guide" },
  { id: "video", title: "Quick Start Video" },
  { id: "resources", title: "Additional Resources" },
  { id: "glossary", title: "Glossary " },
];
</script>

<style scoped>
.v-container, .v-row {
  overflow: visible !important;
}
.toc-sticky {
  position: sticky;
  top: 80px;
  height: fit-content;
  align-self: flex-start;
}

.paragraph {
  font-size: 1rem;
  color: #424242;
  line-height: 1.6;
  margin: 12px 0;
}

.custom-bullet-list {
  list-style: none;
  margin: 0;
  padding-left: 0;
  margin-left: 2rem;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}

.custom-bullet-list li {
  position: relative;
  padding-left: 1.75rem;
  margin-bottom: 10px;
  font-size: 0.95rem;
  color: #424242;
  line-height: 1.6;
}

.custom-bullet-list li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.65em;
  width: 0.5rem;
  height: 0.5rem;
  background-color: #013654;
  border-radius: 50%;
}

.note {
  color: #666;
  font-size: 0.85rem;
}

.resource-box {
  background-color: #eef7f9;
  border-left: 4px solid #013654;
  font-size: 1rem;   
  line-height: 1.5;    
  color: #424242;
}

.resource-box ul {
  padding-left: 2rem;
  margin: 0;
}
.resource-box li {
  margin-bottom: 6px;
}
.resource-box a {
  color: #07315b;
  text-decoration: none;
}
.resource-box a:hover {
  text-decoration: underline;
}

.glossary {
  margin: 0;
  padding: 0;
}

.glossary-item {
  margin-bottom: 1rem;
}

.glossary dt {
  font-weight: 600;
  color: #013654;  
  margin-bottom: 0.25rem;
  font-size: 1rem;
}

.glossary dd {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: #424242;
  line-height: 1.5;
}

[id] {
  scroll-margin-top: 120px; 
}

</style>

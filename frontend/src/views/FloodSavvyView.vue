<template>
  <section id="floodsavvy" class="py-12">
    <v-container>
      <v-row>
        <!-- Left column: TOC -->
        <v-col cols="12" md="3" class="toc-sticky">
          <TableOfContents :toc-items="tocItems" :scroll-handler="scrollToSection" />
        </v-col>

        <!-- Right column: Main -->
        <v-col cols="12" md="9">
          
          <!-- Intro -->
          <div id="intro" class="text-left mb-12">
            <h3 class="ma-2">How do I use FloodSavvy?</h3>
            <p class="paragraph">
              To help guide you through FloodSavvy’s key capabilities, here are some 
              scenario-based exercises related to water-related decision-making and 
              community resilience planning. It is recommended that you duplicate 
              the browser so you can view the scenario instructions whilst using 
              the FloodSavvy resource.
            </p>
          </div>          

          <!-- Scenarios -->
          <div id="scenarios" class="text-left mb-12">
            <h3 class="ma-2">Scenario Exercises</h3>
            <p class="paragraph">
              Before starting, it is recommended that you duplicate the browser 
              so that you can view the scenario instructions whilst using FloodSavvy. 
              We recommend completing these scenarios sequentially if you are a first 
              time user of FloodSavvy.
            </p>

            <ScenarioBox
              id="scenario1"
              title="Scenario 1: Using historical streamflow data to evaluate past flood events"
              description="As a floodplain manager for a mid-sized municipality, 
                you are working on updating your city’s flood hazard mitigation plan. Your team 
                wants to better understand the frequency and magnitude of flood events from 
                the past 8-10 years."
              :taskPdf="taskPdf1"
              :videoUrl="video1"
            />

            <ScenarioBox
              id="scenario2"
              title="Scenario 2: Pairing historical streamflow data with flood maps to identify vulnerable areas"
              description="You are part of a watershed alliance working on a community resilience 
              grant. Your plan includes an analysis of historical flood exposure and inundation 
              risks, with the intention of prioritizing vulnerable communities."
              :taskPdf="taskPdf2"
              :videoUrl="video2"
            />

            <ScenarioBox
              id="scenario3"
              title="Scenario 3: Monitoring streamflow when heavy rains are forecasted"
              description="You are an emergency manager who would like to use FloodSavvy as 
              a source of forecasted information to assess potential flooding risks from 
              heavy rainfall. "
              :taskPdf="taskPdf3"
              :videoUrl="video3"
            />
          </div>

          <!-- Community Narratives Section -->
          <div class="text-left mb-12" id="community-narratives">
            <h3 class="ma-2">Community Narratives</h3>
            <p class="paragraph">
              The six communities involved in this project had diverse applications of FloodSavvy 
              and information derived from the National Water Model. These included monitoring ungauged 
              streams for improved forecast fidelity, exploring potential flood scenarios and identifying 
              vulnerable areas, as well as improving flood awareness within the community. 
              To learn more about the communities and their use cases of FloodSavvy, please visit the
              <a href="https://globalresilience.northeastern.edu/project/ciroh-phase-3/" 
                target="_blank" 
                rel="noopener">
               project website</a>.
              Please check back in Fall 2025 for links to community use-case narratives.
            </p>
          </div>

          <!-- Grid of PDF placeholders -->
          <v-row class="mb-12">
            <v-col cols="12" md="4" v-for="(pdf, i) in communityPdfs" :key="i">
              <v-card class="overflow-hidden" style="border-radius: 6px; cursor: pointer;" @click="openPdf(pdf)">
                <iframe
                  :src="pdf.src + '#page=1&view=fitH&toolbar=0'"
                  :title="pdf.title"
                  style="width: 100%; height: 300px; border: none;"
                ></iframe>
                <v-card-text class="text-center" style="font-size: 0.9rem; color: #1976d2;">
                  {{ pdf.title }}
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Shared PDF Dialog -->
          <v-dialog v-model="showPdf" max-width="900px">
            <v-card>
              <v-toolbar color="#013654" dark dense flat>
                <v-toolbar-title>{{ modalTitle }}</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="showPdf = false"><v-icon>mdi-close</v-icon></v-btn>
              </v-toolbar>
              <v-card-text style="padding: 0;">
                <iframe
                  :src="currentPdf"
                  style="width: 100%; height: 600px; border: none;"
                ></iframe>
              </v-card-text>
            </v-card>
          </v-dialog>

          <!-- Section 3: FAQs -->
          <div id="faq" class="text-left mb-12">
            <h3 class="ma-2">Frequently Asked Questions about FloodSavvy</h3>
            <p class="paragraph">
              If you still have questions about the FloodSavvy resource, 
              please reach out to our team via the <router-link to="/contact">Contact Us</router-link> 
              page. Below are some of the most common questions we receive about using FloodSavvy.
            </p>
          </div>

          <v-sheet class="pa-4 resource-box" elevation="0" rounded>
            <ul class="faq-list">
              <li>
                <strong>Q: I’m not from one of the six communities serviced by FloodSavvy. Where can I find similar information?</strong>
                <p>
                  The National Water Prediction Service (NWPS) hosts the National Water Model (NWM) 
                  and offers valuable information for all U.S. communities. We have created a tutorial 
                  to help orient you to the NWPS landing page and navigate to the information you might need. 
                  This tutorial can be found on the National Water Model Resources page.
                </p>
              </li>
              <li>
                <strong>Q: Where is streamflow information and flood maps sourced from?</strong>
                <p>
                  Streamflow information and flood maps are sourced from NOAA’s National Water Model (NWM), 
                  which integrates data from weather forecasts, terrain models, and streamflow observations.
                </p>
              </li>
              <li>
                <strong>Q: Why is there no data available on a river I selected?</strong>
                <p>
                  Some rivers and streams are not currently represented with full datasets in FloodSavvy. 
                  In certain cases, smaller tributaries or locations near reservoirs may not have modeled 
                  outputs. These limitations are part of the model design and data coverage.
                </p>
              </li>
              <li>
                <strong>Q: Where does FloodSavvy work well?</strong>
                <p>
                  FloodSavvy may not account for localized impacts near reservoirs, levees, or small-scale urban drainage systems.
                </p>
              </li>
              <li>
                <strong>Q: Where can I find more information about expected streamflow values in my area?</strong>
                <p>
                  To find more information about expected streamflow values on a river or stream of interest, 
                  visit the <a href="https://waterdata.usgs.gov" target="_blank" rel="noopener">USGS Water Data</a> 
                  website for gauged sites, or use the National Water Model (NWM). The NWM includes a 
                  streamflow anomaly layer that highlights rivers and streams experiencing higher or lower 
                  than normal flow rates in near real-time conditions. Please use the NWM Tutorial on the 
                  National Water Model Resources page to access this information.
                </p>
              </li>
              <li>
                <strong>Q: Where can I find more information on flood warnings?</strong>
                <p>
                  To find more information on current, official flood warnings, please visit the 
                  <a href="https://www.weather.gov" target="_blank" rel="noopener">National Weather Service</a> 
                  website and navigate to the "Latest Warnings" page. Consider contacting your local Weather Forecast 
                  Office for more details.
                </p>
              </li>
            </ul>
          </v-sheet>

        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<script setup>
import TableOfContents from "@/components/TableOfContents.vue";
import ScenarioBox from "@/components/ScenarioBox.vue";
import { ref, provide } from "vue";

// Scenario Task PDF imports 
import taskPdf1 from "@/assets/NWM_Tutorial_1020.pdf";
import taskPdf2 from "@/assets/NWM_Tutorial_1020.pdf";
import taskPdf3 from "@/assets/NWM_Tutorial_1020.pdf";

// Community Narratives Task PDF imports 
import pdf1 from "@/assets/NWM_Tutorial_1020.pdf";
import pdf2 from "@/assets/NWM_Tutorial_1020.pdf";
import pdf3 from "@/assets/NWM_Tutorial_1020.pdf";
import pdf4 from "@/assets/NWM_Tutorial_1020.pdf";
import pdf5 from "@/assets/NWM_Tutorial_1020.pdf";
import pdf6 from "@/assets/NWM_Tutorial_1020.pdf";

const communityPdfs = [
  { title: "Community 1 Narrative", src: pdf1 },
  { title: "Community 2 Narrative", src: pdf2 },
  { title: "Community 3 Narrative", src: pdf3 },
  { title: "Community 4 Narrative", src: pdf4 },
  { title: "Community 5 Narrative", src: pdf5 },
  { title: "Community 6 Narrative", src: pdf6 },
];

// Scenario video URL
const video1 = "https://www.youtube.com/embed/bdXhQ4JRI88?si=O1Vx7WqEi-aCsJQv";
const video2 = "https://www.youtube.com/embed/bdXhQ4JRI88?si=O1Vx7WqEi-aCsJQv";
const video3 = "https://www.youtube.com/embed/bdXhQ4JRI88?si=O1Vx7WqEi-aCsJQv";

// PDF modal
const showPdf = ref(false);
const modalTitle = ref("");
const currentPdf = ref("");

// Provide openPdf to children
const openPdf = (pdf, title) => {
  modalTitle.value = title;
  currentPdf.value = pdf;
  showPdf.value = true;
};
provide("openPdf", openPdf);

// TOC
const tocItems = [
  { id: "intro", title: "How do I use FloodSavvy?" },
  { 
    id: "scenarios", 
    title: "Scenario Exercises",
    subsections: [
      { id: "scenario1", title: "Scenario 1: Historical Forecasts" },
      { id: "scenario2", title: "Scenario 2: Flood Resilience Plan" },
      { id: "scenario3", title: "Scenario 3: Flood Resilience Plan" },
    ]
  },
  { id: "community-narratives", title: "Community Narratives" },
  { id: "faq", title: "FAQs" },
];

// Smooth scroll with offset
const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
};
</script>

<style scoped>
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

.resource-box {
  background-color: #eef7f9;
  border-left: 4px solid #013654;
  font-size: 0.95rem;
  color: #424242;
  line-height: 1.5;
}

.custom-bullet-list {
  margin: 0;
  padding-left: 1rem;
}
.custom-bullet-list li {
  margin-bottom: 6px;
  line-height: 1.6;
}

.faq-list {
  list-style: none;
  padding-left: 0;
  margin: 0;
}
.faq-list li {
  margin-bottom: 1rem;
}
.faq-list strong {
  display: block;
  color: #013654;
  margin-bottom: 0.25rem;
}
.faq-list p {
  margin: 0;
  font-size: 0.95rem;
  color: #424242;
  line-height: 1.5;
}

[id] {
  scroll-margin-top: 120px; 
}
</style>

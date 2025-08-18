<template>
  
  <v-container class="about">
    <v-sheet class="pa-6 mx-auto" max-width="1200" rounded>
      <h3 class="ma-2" >Project Objective</h3>
      <p style="padding: 12px 16px 12px 24px; padding: 12px 16px">
        Via a collaboration between the
        <a href="https://globalresilience.northeastern.edu/" target="_blank" rel="noopener">
          Global Resilience Institute (GRI)</a>
        at Northeastern University and
        <a href="https://www.cuahsi.org/" target="_blank" rel="noopener">
          Consortium of Universities for the Advancement of Hydrologic Science, Inc. (CUAHSI)</a>, 
        this resource was developed as part of a three-phase study funded by the 
        <a href="https://ciroh.ua.edu/" target="_blank" rel="noopener">
          Cooperative Institute for Research to Operations in Hydrology (CIROH)</a>. 
          The study aimed to investigate how
        <a
          href="https://water.noaa.gov/"
          target="_blank"
          rel="noopener"
        >
          NOAA’s National Water Model (NWM)
        </a>
        could support community water- and resilience-related planning and decision making, 
        and how NOAA’s National Water Center could enable and strengthen that use. Specifically, 
        this study sought to expand the potential users of the NWM and increase its accessibility 
        for non-technical end-users.  For more information, please visit the
        <a
          href="https://globalresilience.northeastern.edu/project/cooperative-institute-for-research-to-operations-in-hydrology-ciroh/"
          target="_blank"
          rel="noopener"
        >
          project page at the Global Resilience Institute. </a
        >.
      </p>

      <h3 class="ma-2" >What is the NWM?</h3>
      <p class="mt-0">The NWM is a hydrologic model that simulates streamflow for every river and stream reach 
      across the United States. It inputs USGS gauge and weather data as well as land-surface models 
      to predict real-time streamflow conditions at both gauged and ungauged river reaches. 
      The NWM also provides streamflow forecasts at 18-hour, 10-day and 30-day intervals and stores 
      retrospective data from the past 40 years. 
      </p>

      <h3 class="ma-2" >Resource Co-Development Process</h3>
      <p class="mt-0">
        This study consisted of three phases with the development of FloodSavvy, being the result of Phase 3. 
        <a
          href="https://globalresilience.northeastern.edu/project/ciroh-phase-1/"
          target="_blank"
          rel="noopener"
        >
          The first phase </a> of this study revealed that over 60% of the folks engaged in resilience-related 
          decision-making and planning had never heard of the NWM before, but once they had, they had many ideas 
          for how it could be used to enhance their work. Then, 
        <a
          href="https://globalresilience.northeastern.edu/project/ciroh-phase-1/https://globalresilience.northeastern.edu/project/ciroh-phase-2/"
          target="_blank"
          rel="noopener"
        >
          Phase 2 </a> explored some of these ideas in practice, working with a subset of the stakeholders from Phase 1. 
          During this process, it became clear that stakeholders faced many challenges when trying to access the 
          information they needed from the NWM. Therefore, 
          <a
          href="https://globalresilience.northeastern.edu/project/ciroh-phase-1/https://globalresilience.northeastern.edu/project/ciroh-phase-2/"
          target="_blank"
          rel="noopener"
        >
          Phase 3 </a> undertook a co-development approach that worked with communities in Vermont and Missouri to 
          investigate how NWM information could be made more accessible. The co-development process involved three steps:
      </p>

      <v-sheet
        class="mt-2 mb-4 pa-4"
        style="background-color: #f0f0f0; border-left: 4px solid #9e9e9e"
        elevation="0"
        rounded
      >
        <ol class="default-font-style" style="padding-left: 4rem; border-radius: 12px; margin: 0">
          <li>
            Interviews with Vermont and Missouri stakeholders to better understand how decision making operates in their communities and organizations, their water-related information needs and priorities, and their ideas for how the NWM could help meet these needs.
          </li>
          <li>
            Collaborative sessions between the research team, NOAA, and the community stakeholders to co-generate ideas for supplementary resources that would help them access and use the information they desire from the NWM.
          </li>
          <li>
            Resource co-development which occurred over a series of meetings between the research team and community stakeholders. These meetings were used to map the stakeholder needs to resource capabilities and then continually iterate on the resource design and features to ensure alignment.
          </li>
        </ol>
      </v-sheet>

      <p> The result of Phase 3 is this pilot resource, FloodSavvy, that demonstrates new ways of accessing and interpreting information available from NOAA’s NWM via the National Water Prediction Service (NWPS). </p>

      <h3 class="ma-2" >Funding Acknowledgement</h3>
      <p class="mt-0">This research was supported by the Cooperative Institute for Research to Operations in Hydrology (CIROH) with funding under award NA22NWS4320003 from the NOAA Cooperative Institute Program. The statements, findings, conclusions, and recommendations are those of the author(s) and do not necessarily reflect the opinions of NOAA. </p>

    </v-sheet>
  </v-container>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 50vh;
  }
}
</style>

<script setup></script>

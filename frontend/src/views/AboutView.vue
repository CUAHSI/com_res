<template>
  <h2 class="ma-2 text-center">Project Description</h2>
  <v-container class="about">
    <v-sheet class="pa-6 mx-auto " max-width="1200" rounded>
      <p style="padding: 12px 16px 12px 24px; 
              padding: 12px 16px;
              font-size: 20px;
              line-height: 1.8;
              font-family: 'Roboto', sans-serif;
              color: #000000;
              font-weight: 350;
              border-radius: 12px;">
        Via a collaboration between the 
        <a href="https://globalresilience.northeastern.edu/" target="_blank" rel="noopener">
          Global Resilience Institute
        </a> 
        at Northeastern University and 
        <a href="https://www.cuahsi.org/" target="_blank" rel="noopener">CUAHSI</a>, this 
        resource was developed as part of a three-phase study funded by the 
        <a href="https://ciroh.ua.edu/" target="_blank" rel="noopener">
          Cooperative Institute for Research to Operations in Hydrology (CIROH)
        </a>.
        The study aimed to investigate how 
        <a href="https://water.noaa.gov/#@=-96.401081,38.1465724,3.4344811&b=topographic&g=obsFcst,1!1!1!1!1!1!1!1!1!1!1!1!1!1!1!0!0!0!0!0,0.5,1!1!1!1!0,0,0,true&ab=0,0,#D94B4A,1,1,1,#cccccc,1,0,0,#B243B1,1,0,0,#98E09A,1,false&a=hydrologic,0.35,false&s=0,0,0.9,0.9,false&n=false,#72afe9,0.9,0,0.9,0,0.9,false&p=false,0.75,0,7,0,1,2025,5,21,0,false&d=0,0,1,1,1,1,1,1,#006EFF,1,#006EFF,1,#006EFF,1,#006EFF,1,#006EFF,false&q=" 
          target="_blank" rel="noopener">
          NOAA’s National Water Model
        </a> 
        could support community water- and resilience-related planning and decision making, and how NOAA’s 
        National Water Center could enable and strengthen that use. For more information, please visit the 
        <a href="https://globalresilience.northeastern.edu/project/cooperative-institute-for-research-to-operations-in-hydrology-ciroh/" 
          target="_blank" rel="noopener">
          project page at the Global Resilience Institute
        </a>.
      </p>

      <p class="mt-0" style=
              "padding: 12px 16px 12px 24px; 
              padding: 12px 16px;
              font-size: 20px;
              line-height: 1.8;
              font-family: 'Roboto', sans-serif;
              color: #000000;
              font-weight: 350;
              border-radius: 12px;">
        This resource was co-developed between the GRI/CUAHSI research team and community stakeholders 
        in Vermont and Missouri. The co-development process involved three steps:
      </p>
      
      <v-sheet
        class="mt-2 mb-4 pa-4"
        style="background-color: #f0f0f0; border-left: 4px solid #9e9e9e;"
        elevation="0"
        rounded
      >
        <ol style=" 
              padding-left: 4rem;
              font-size: 18px;
              line-height: 1.8;
              font-family: 'Roboto', sans-serif;
              color: #000000;
              font-weight: 350;
              border-radius: 12px; margin: 0; " >
        <li>
          Interviews with Vermont and Missouri stakeholders to better understand how decision making operates 
          in their communities and organizations, their information needs and priorities, and their ideas for how 
          the NWM could help meet these needs.
        </li>
        <li>
          Collaborative sessions between the research team, NOAA, and the community stakeholders to co-generate 
          ideas for supplementary resources that would help them access and use the information they desire from the NWM.
        </li>
        <li>
          Resource co-development over the course of a series of meetings between the research team and community 
          stakeholders to map the priority needs to resource capabilities and then iterate on the resource design and 
          features to ensure they align with stakeholder needs.
        </li>
      </ol>
      </v-sheet>
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

<script setup>
import { loremIpsum } from 'lorem-ipsum'
</script>

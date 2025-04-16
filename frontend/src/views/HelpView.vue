<template>
  <h2 class="ma-2 text-center">Help</h2>
  <v-container>
    {{ loremIpsum({ count: 2, units: 'paragraphs', paragraphLowerBound: 7 }) }}
    <br /><br />
    {{ loremIpsum({ count: 2, units: 'paragraphs', paragraphLowerBound: 7 }) }}
  </v-container>
</template>
<script setup>
import { loremIpsum } from 'lorem-ipsum'
</script>

<template>
  <h2 class="ma-2 text-center">About</h2>
  <v-container class="about">
    <v-sheet class="pa-6 mx-auto ma-4" max-width="1200" rounded>
      <p>
        {{ loremIpsum({ count: 3, units: 'paragraphs' }) }}
      </p>
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

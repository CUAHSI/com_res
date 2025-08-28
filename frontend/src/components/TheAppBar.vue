<template>
  <v-app-bar
    v-if="!$route.meta.hideNavigation"
    color="navbar"
    ref="appBar"
    id="app-bar"
    elevate-on-scroll
    fixed
    app
    height="100"
  >
    <template v-slot:image>
      <v-img gradient="to top right, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.3)"></v-img>
    </template>
    <template v-slot:prepend>
      <router-link :to="{ path: `/` }" class="logo">
        <v-img :width="70" cover :src="imgUrl" alt="home"></v-img>
      </router-link>
    </template>
    <v-app-bar-title class="text-h4">FloodSavvy</v-app-bar-title>

    <v-tabs v-if="!mdAndDown" v-model="path" align-tabs="title">
      <v-tab
        v-for="path of paths"
        v-bind="path.attrs"
        :key="path.attrs.to || path.attrs.href"
        :text="path.label"
        :id="`navbar-nav-${path.label.replaceAll(/[\/\s]/g, ``)}`"
      ></v-tab>
    </v-tabs>
    <v-spacer></v-spacer>
    <v-tooltip text="Report an Issue" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props" @click="toggleGithubDialog">
          <v-icon :icon="mdiGithub"></v-icon>
        </v-btn>
      </template>
    </v-tooltip>
    <v-app-bar-nav-icon @click="$emit('toggleMobileNav')" v-if="mdAndDown" />
  </v-app-bar>
  <v-dialog v-model="showGithubDialog" max-width="500">
    <v-card>
      <v-card-title>Create an Issue</v-card-title>
      <v-card-text class="d-flex flex-wrap justify-center">
        <p class="text-body-1">
          Please report any issues you find with FloodSavvy to our GitHub repository.
        </p>
        <v-btn
          variant="outlined"
          color="primary"
          class="ma-2"
          :href="'https://github.com/CUAHSI/com_res/issues/new?template=bug_report.md'"
          target="_blank"
        >
          Report a Bug
        </v-btn>
        <v-btn
          variant="outlined"
          color="primary"
          class="ma-2"
          :href="'https://github.com/CUAHSI/com_res/issues/new?template=feature_request.md'"
          target="_blank"
        >
          Request a Feature
        </v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<script setup>
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import imgUrl from '@/assets/floodsavvy_icon.png'
defineProps(['paths'])
defineEmits(['toggleMobileNav'])
import { mdiGithub } from '@mdi/js'

const route = useRoute()
const path = ref(route.path)
const showGithubDialog = ref(false)

watch(
  () => route.path,
  (newPath) => {
    path.value = newPath
  }
)

const { mdAndDown } = useDisplay()
const toggleGithubDialog = () => {
  showGithubDialog.value = !showGithubDialog.value
}
</script>

<style lang="scss" scoped>
.logo {
  height: 100%;
  display: flex;
  align-items: center;
  cursor: pointer;

  img {
    height: 100%;
    width: auto;
    object-fit: contain;
    display: block;
  }
}

.v-toolbar.v-app-bar--is-scrolled > .v-toolbar__content > .container {
  align-items: center !important;
  will-change: padding;
  padding-top: 0;
  padding-bottom: 0;
}

.nav-items {
  overflow: hidden;
}

// .nav-items .v-btn.is-active,
// .mobile-nav-items .v-list-item.is-active {
//   background-color: #1976d2 !important;
//   color: #FFF;
// }
</style>

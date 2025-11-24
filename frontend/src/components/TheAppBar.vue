<template>
  <v-app-bar
    v-if="!$route.meta.hideNavigation"
    id="app-bar"
    ref="appBar"
    color="navbar"
    elevate-on-scroll
    fixed
    app
    height="100"
  >
    <template #image>
      <v-img gradient="to top right, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.3)" />
    </template>
    <template #prepend>
      <router-link :to="{ path: `/` }" class="logo">
        <v-img :width="70" cover :src="imgUrl" alt="home" />
      </router-link>
    </template>
    <v-app-bar-title class="text-h4"> FloodSavvy </v-app-bar-title>

    <v-tabs v-if="!mdAndDown" v-model="path" align-tabs="title">
      <template v-for="(item, i) in paths" :key="i">
        <!-- handle children items as dropdown menus -->
        <v-menu v-if="item.children" open-on-hover>
          <template #activator="{ props }">
            <v-tab v-bind="props" :text="item.label" />
          </template>
          <v-list>
            <v-list-item v-for="(child, j) in item.children" :key="j" :to="child.attrs.to" link>
              <v-list-item-title>{{ child.label }}</v-list-item-title>
            </v-list-item>
          </v-list>
          <!-- handle normal items as tabs -->
        </v-menu>
        <v-tab
          v-else
          v-bind="item.attrs"
          :id="`navbar-nav-${item.label.replaceAll(/[\/\s]/g, ``)}`"
          :text="item.label"
        />
      </template>
    </v-tabs>
    <v-spacer />
    <v-tooltip text="Report an Issue" location="bottom">
      <template #activator="{ props }">
        <v-btn icon v-bind="props" @click="toggleGithubDialog">
          <v-icon :icon="mdiGithub" />
        </v-btn>
      </template>
    </v-tooltip>
    <v-app-bar-nav-icon v-if="mdAndDown" @click="$emit('toggleMobileNav')" />
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
defineProps({
  paths: {
    type: Array,
    default: () => []
  }
})
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

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
    <v-app-bar-title class="text-h4">FloodWise</v-app-bar-title>

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
  </v-app-bar>
</template>
<script setup>
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import imgUrl from '@/assets/floodwise_icon.jpg'
defineProps(['paths'])
defineEmits(['toggleMobileNav'])

const route = useRoute()
const path = ref(route.path)

watch(
  () => route.path,
  (newPath) => {
    path.value = newPath
  }
)

const { mdAndDown } = useDisplay()
</script>

<style lang="scss" scoped>
.logo {
  height: 100%;
  cursor: pointer;

  img {
    height: 100%;
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

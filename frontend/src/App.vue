<template>
  <v-app>
    <v-main>
      <AlertPopup v-bind="alertStore.displayed" :style="{ 'z-index': '999999' }"></AlertPopup>
      <DisclaimerDialog
        v-if="!alertStore.disclaimer_accepted"
        @accept="alertStore.acceptDisclaimer"
        :style="{ 'z-index': '999999' }"
      />
      <TheAppBar @toggle-mobile-nav="toggleMobileNav" :paths="paths" />
      <TheMobileNavDrawer
        @toggle-mobile-nav="toggleMobileNav"
        :show="showMobileNavigation"
        :paths="paths"
      />
      <RouterView v-slot="{ Component }">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
      <link
        href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900"
        rel="stylesheet"
      />
      <SnackBar />
      <TheFooter />
    </v-main>
  </v-app>
</template>

<script setup>
import { RouterView, useRouter } from 'vue-router'
import TheAppBar from './components/TheAppBar.vue'
import TheMobileNavDrawer from '@/components/TheMobileNavDrawer.vue'
import AlertPopup from './components/AlertPopup.vue'
import SnackBar from './components/SnackBar.vue'
import TheFooter from './components/TheFooter.vue'
import { ref, watch } from 'vue'
import { useAlertStore } from './stores/alerts'
import { useRegionsStore } from './stores/regions'
import DisclaimerDialog from './components/DisclaimerDialog.vue'
import { storeToRefs } from 'pinia'

const router = useRouter()
const alertStore = useAlertStore()
const regionsStore = useRegionsStore()

const { need_disclaimer } = storeToRefs(alertStore)
const { currentRegion } = storeToRefs(regionsStore)

let showMobileNavigation = ref(false)
const paths = [
  {
    attrs: { to: '/' },
    label: 'Home'
  },
  {
    attrs: { to: '/maps' },
    label: 'Maps'
  },
  {
    attrs: { to: '/resources' },
    label: 'Resources'
  },
  {
    attrs: { to: '/about' },
    label: 'About'
  },
  {
    attrs: { to: '/contact' },
    label: 'Contact'
  }
]

function toggleMobileNav() {
  showMobileNavigation.value = !showMobileNavigation.value
}

watch(
  [() => need_disclaimer.value, () => router.currentRoute.value.path],
  async ([newNeedDisclaimer, path]) => {
    if (path === '/maps') {
      const { region } = router.currentRoute.value.query
      if (region) {
        regionsStore.setRegion(region)
      }
      if (!newNeedDisclaimer && !currentRegion.value) {
        alertStore.displayAlert({
          title: 'No Region Selected',
          text: 'You must select a region to view its data.',
          type: 'error',
          closable: true,
          duration: 2
        })
      }
    }
  }
)
</script>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>

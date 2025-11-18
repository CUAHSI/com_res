<template>
  <!-- use location="right" for the naviagation drawer
       so it doesnt interfere with map buttons -->
  <v-navigation-drawer
    v-if="mdAndDown"
    :model-value="props.show"
    class="mobile-nav-items"
    temporary
    app
    location="right"
  >
    <v-list nav dense class="nav-items">
      <v-list class="text-body-1">
        <template v-for="path in paths" :key="path.label">
          <!-- Items with children -->
          <v-list-group v-if="path.children" :value="path.label" no-action>
            <template v-slot:activator="{ props: activatorProps }">
              <v-list-item v-bind="activatorProps">
                <v-list-item-title>{{ path.label }}</v-list-item-title>
              </v-list-item>
            </template>

            <v-list-item
              v-for="child in path.children"
              :key="child.attrs.to"
              :to="child.attrs.to"
              link
              @click="$emit('toggleMobileNav')"
            >
              <v-list-item-title>{{ child.label }}</v-list-item-title>
            </v-list-item>
          </v-list-group>

          <!-- Items without children -->
          <v-list-item
            v-else
            v-bind="path.attrs"
            @click="$emit('toggleMobileNav')"
            :id="`drawer-nav-${path.label.replaceAll(/[\/\s]/g, ``)}`"
            active-class="primary darken-3 white--text"
            :class="path.isActive?.() ? 'primary darken-4 white--text' : ''"
          >
            <span>{{ path.label }}</span>
          </v-list-item>
        </template>
      </v-list>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { useDisplay } from 'vuetify'

const props = defineProps(['show', 'paths'])
defineEmits(['toggleMobileNav'])

const { mdAndDown } = useDisplay()
</script>

<style scoped>
.mobile-nav-items {
  z-index: 999999 !important;
}
</style>

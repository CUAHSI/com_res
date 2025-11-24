<template>
  <v-alert
    v-show="props.text != ''"
    class="zlert"
    :title="props.title"
    :text="props.text"
    :closeable="props.closeable"
  />
</template>

<script setup>
const props = defineProps({
  text: { type: String, default: '' },
  title: { default: 'Alert', type: String },
  closeable: { default: true, type: Boolean }
})
</script>

<style scoped>
.zlert {
  position: fixed;
  z-index: var(--z-index-alerts);
  width: 100vw;
}
</style>

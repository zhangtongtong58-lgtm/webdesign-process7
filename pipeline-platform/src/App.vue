<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-root">
    <RouterView />
  </div>
</template>

<style lang="scss">
*,
*::before,
*::after { box-sizing: border-box; }

body {
  margin: 0;
  padding: 0;
  background-color: var(--o-color-fill1);
  color: var(--o-color-info1);
  font-family: var(--o-font_family);
  font-size: var(--o-r-font_size-text1);
  line-height: var(--o-r-line_height-text1);
}

.app-root { min-height: 100vh; }
</style>
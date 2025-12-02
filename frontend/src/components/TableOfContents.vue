<template>
  <aside class="toc">
    <div>
      <h4 class="toc-title">Table of Contents</h4>
      <nav>
        <ul class="toc-list">
          <li v-for="item in tocItems" :key="item.id">
            <a href="javascript:void(0);" class="toc-link" @click="scrollToSection(item.id)">
              {{ item.title }}
            </a>

            <!-- Subsections -->
            <ul v-if="item.subsections" class="toc-sublist">
              <li v-for="sub in item.subsections" :key="sub.id">
                <a href="javascript:void(0);" class="toc-sublink" @click="scrollToSection(sub.id)">
                  {{ sub.title }}
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  </aside>
</template>

<script setup>
import { defineProps } from 'vue'

// Define props
defineProps({
  tocItems: {
    type: Array,
    default: () => []
  }
})

// Smooth scroll with offset
const scrollToSection = (id) => {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<style scoped>
.toc {
  position: sticky;
  top: calc(var(--app-bar-height, 96px) + 12px);
  align-self: flex-start;
  z-index: 10;
  background: white;
  padding-right: 1rem;
  border-right: 1px solid #ada8a8;
}

/* Title */
.toc-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-left: 8px;
  color: #212121;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Reset list style */
.toc-list,
.toc-sublist {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

/* Main TOC links */
.toc-link {
  display: block;
  font-size: 0.9rem;
  color: #424242;
  text-decoration: none;
  padding: 6px 8px 6px 12px;
  border-radius: 4px;
  transition:
    background 0.2s,
    color 0.2s;
}
.toc-link:hover {
  background-color: #f5f5f5;
  color: #1976d2;
}

/* Subsections */
.toc-sublist {
  padding-left: 1rem;
  margin-top: 4px;
}
.toc-sublink {
  font-size: 0.85rem;
  color: #666;
  text-decoration: none;
  padding: 4px 8px 4px 16px;
  border-radius: 4px;
  display: block;
}
.toc-sublink:hover {
  background-color: #f5f5f5;
  color: #1976d2;
}

/* Fix: offset target sections so headings don’t get buried under toolbar */
:deep([id]) {
  scroll-margin-top: 120px; /* match navbar height */
}
</style>

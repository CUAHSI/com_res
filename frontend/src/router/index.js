import { createRouter, createWebHashHistory } from 'vue-router'
import ResourcesView from '../views/ResourcesView.vue'
import ContactView from '../views/ContactView.vue'
import MapView from '../views/MapView.vue'
import ApiView from '../views/ApiView.vue'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/maps',
      name: 'maps',
      component: MapView,
      meta: {
        showMap: true
      }
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/api',
      name: 'api',
      component: ApiView
    },
    {
      path: '/resources',
      name: 'resources',
      component: ResourcesView
    },
    {
      path: '/contact',
      name: 'contact',
      component: ContactView
    }
  ]
})

export default router

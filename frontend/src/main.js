import './assets/tailwind.css'
import './assets/main.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVfm } from 'vue-final-modal'
import VueClickAway from 'vue3-click-away'
import VWave from 'v-wave'
import FloatingVue from 'floating-vue'
import Toast from 'vue-toastification'
import 'vue-final-modal/style.css'
import 'vue-toastification/dist/index.css'
import 'floating-vue/dist/style.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(createVfm())
app.use(VueClickAway)
app.use(VWave, { color: 'white', initialOpacity: 0.5, easing: 'ease-in', duration: 0.37 })
app.use(FloatingVue)
app.use(Toast, {
  position: 'bottom-center', timeout: 3500, maxToasts: 2,
  closeOnClick: false, pauseOnFocusLoss: false, pauseOnHover: true,
  draggable: true, draggablePercent: 0.4, showCloseButtonOnHover: false,
  hideProgressBar: true, closeButton: 'button', icon: false,
  newestOnTop: false,
  filterBeforeCreate: (toast, toasts) => toasts.some((current) => current.type === toast.type) ? false : toast,
})

app.mount('#app')

// main.js 顶部加这个
if (typeof window !== 'undefined') {
  window.fs = { readFile: () => {} };
  window.require = (name) => {
    if (name === 'fs') return window.fs;
    return null;
  };
}
import { createApp } from 'vue'
import App from './App.vue'
import './styles/index.scss'
import 'maplibre-gl/dist/maplibre-gl.css'

createApp(App).mount('#app')
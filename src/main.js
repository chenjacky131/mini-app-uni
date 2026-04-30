if (typeof window !== "undefined") {
  window.fs = {
    readFile: (path, callback) => {
      console.log('readFile called with path:', path);
      if (callback) callback(null, null);
    },
    readFileSync: (path) => {
      console.log('readFileSync called with path:', path);
      return null;
    },
    existsSync: (path) => {
      console.log('existsSync called with path:', path);
      return false;
    },
    readdirSync: () => [],
    statSync: () => ({ isFile: () => false, isDirectory: () => false }),
    lstatSync: () => ({ isFile: () => false, isDirectory: () => false }),
  };
  window.require = (module) => {
    if (module === "fs") return window.fs;
    return null;
  };
}
import { createApp } from 'vue'
import App from './App.vue'
import './styles/index.scss'
import 'maplibre-gl/dist/maplibre-gl.css'

createApp(App).mount('#app')
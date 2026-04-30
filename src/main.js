if (typeof window !== "undefined") {
  // 模拟空 fs，阻止 pointcloud 插件调用 node fs
  window.fs = {
    readFile: () => {},
    readFileSync: () => {},
    existsSync: () => false,
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
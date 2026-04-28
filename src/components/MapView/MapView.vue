
<template>
  <div class="map-view">
    <div id="maplibre-container" class="map-container"></div>
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const props = defineProps({
  center: {
    type: Array,
    default: () => [116.39735, 39.90925],
  },
  zoom: {
    type: Number,
    default: 18,
  },
});

const emit = defineEmits(["map-ready"]);

const map = ref(null);

onMounted(() => {
  initMap();
});

onUnmounted(() => {
  if (map.value) {
    map.value.remove();
  }
});

const initMap = () => {
  map.value = new maplibregl.Map({
    container: "maplibre-container",
    style: {
      version: 8,
      sources: {
        "osm-tiles": {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
        },
      },
      layers: [
        {
          id: "osm-tiles-layer",
          type: "raster",
          source: "osm-tiles",
          minzoom: 0,
        },
      ],
    },
    center: props.center,
    zoom: props.zoom,
  });

  map.value.on("load", () => {
    emit("map-ready", map.value);
  });
  map.value.on("click", (e) => {
    const { lng, lat } = e.lngLat;
    console.log([lng, lat]);
  });
};

const addPointCloudLayer = (id, data, color = [255, 255, 255]) => {
  if (!map.value) return;

  const sourceId = `${id}-source`;
  const layerId = `${id}-layer`;

  if (map.value.getSource(sourceId)) {
    map.value.getSource(sourceId).setData(data);
  } else {
    map.value.addSource(sourceId, {
      type: "geojson",
      data: data,
    });

    map.value.addLayer({
      id: layerId,
      type: "circle",
      source: sourceId,
      paint: {
        "circle-radius": 3,
        "circle-color": `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
      },
    });
  }
};

const addRouteLayer = (id, data) => {
  if (!map.value) return;

  const sourceId = `${id}-source`;
  const layerId = `${id}-layer`;

  if (map.value.getSource(sourceId)) {
    map.value.getSource(sourceId).setData(data);
  } else {
    map.value.addSource(sourceId, {
      type: "geojson",
      data: data,
    });

    map.value.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#00ff00",
        "line-width": 3,
      },
    });
  }
};

const addRobotMarker = (position, heading = 0) => {
  if (!map.value) return;

  const el = document.createElement("div");
  el.className = "robot-marker";
  el.innerHTML = `
    <svg t="1777253425986" class="icon" viewBox="0 0 40 40" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5230" xmlns:xlink="http://www.w3.org/1999/xlink" width="40" height="40" style="transform: rotate(${heading}deg)"><path d="M964.00032 547.16A89.864 89.864 0 0 1 1024.00032 632c0 24.04-9.36 46.64-26.36 63.64l-42.424-42.424A29.8 29.8 0 0 0 964.00032 632a29.968 29.968 0 0 0-30-29.984A29.968 29.968 0 0 0 904.00032 632c0 8.016 3.12 15.544 8.792 21.216l-42.432 42.424A89.408 89.408 0 0 1 844.00032 632c0-39.36 25.144-72.576 60-84.84v-70.32a90.424 90.424 0 0 1-54.84-54.84H782.00032v305.016c68.384 13.936 120 74.544 120 146.984 0 82.712-67.288 150-150 150H272.00032c-82.712 0-150-67.288-150-150 0-72.44 51.616-133.04 120-146.984V422h-67.16A90.424 90.424 0 0 1 120.00032 476.84v70.32A89.856 89.856 0 0 1 180.00032 632c0 24.04-9.36 46.64-26.36 63.64l-42.424-42.432A29.8 29.8 0 0 0 120.00032 632c0-18.712-15.984-30.856-32-29.944-15.232 0.872-28 13.752-28 29.944 0 8.016 3.12 15.544 8.792 21.216l-42.432 42.424A89.408 89.408 0 0 1 0.00032 632c0-39.368 25.144-72.576 60-84.84v-70.32C25.08032 464.456 0.00032 431.112 0.00032 392c0-49.624 40.376-90 90-90 39.112 0 72.456 25.08 84.84 60h67.16v-60h180V240h-60c-66.168 0-120-53.832-120-120s53.832-120 120-120h300c66.168 0 120 53.832 120 120s-53.832 120-120 120h-60v62h180v60h67.16c12.384-34.92 45.728-60 84.84-60 49.624 0 90 40.376 90 90 0 39.112-25.08 72.456-60 84.84v70.32zM662.00032 60c-33.08 0-60 26.92-60 60s26.92 60 60 60 60-26.92 60-60-26.92-60-60-60z m-572 362A30.032 30.032 0 0 0 120.00032 392a30.032 30.032 0 0 0-30-30A30.032 30.032 0 0 0 60.00032 392a30.032 30.032 0 0 0 30 30zM465.85632 59.8A119.96 119.96 0 0 1 482.00032 120c0 21.848-5.896 42.336-16.144 60h92.288A119.216 119.216 0 0 1 542.00032 120c0-21.848 5.896-42.536 16.144-60.2H465.85632zM542.00032 240h-60v62h60V240z m-180-60c33.088 0 60-26.92 60-60s-26.912-60-60-60-60 26.92-60 60 26.912 60 60 60z m0 242h300v180h-300v-180z m240 120v-60h-180v60h180z m-300-180V724h420V362h-420z m-60 482h60v60h-60v-60z m30 120c49.624 0 90-40.376 90-90S321.62432 784 272.00032 784s-90 40.376-90 90S222.37632 964 272.00032 964z m360.08 0a149.216 149.216 0 0 1-30.08-90c0-33.744 11.2-64.912 30.08-90H391.92032a149.216 149.216 0 0 1 30.08 90c0 33.744-11.2 64.912-30.08 90h240.16z m89.92-120h60v60h-60v-60z m120 30c0-49.624-40.376-90-90-90s-90 40.376-90 90S702.37632 964 752.00032 964s90-40.376 90-90z m92-452A30.032 30.032 0 0 0 964.00032 392a30.032 30.032 0 0 0-30-30A30.032 30.032 0 0 0 904.00032 392a30.032 30.032 0 0 0 30 30z" fill="#40BEFE" p-id="5231"></path></svg>
  `;
  el.style.cursor = "pointer";

  const existing = document.getElementById("robot-marker");



  if (existing) {
    existing.remove();
  }
  el.id = "robot-marker";

  map.value.getContainer().appendChild(el);

  const marker = new maplibregl.Marker({ element: el })
    .setLngLat(position)
    .addTo(map.value);

  return marker;
};

const clearLayers = () => {
  if (!map.value) return;

  const layers = map.value.getStyle().layers;
  layers.forEach((layer) => {
    if (
      layer.id.includes("point-cloud") ||
      layer.id.includes("robot-route") ||
      layer.id.includes("robot-marker")
    ) {
      map.value.removeLayer(layer.id);
    }
  });

  const sources = Object.keys(map.value.getStyle().sources);
  sources.forEach((source) => {
    if (source.includes("point-cloud") || source.includes("robot-route")) {
      map.value.removeSource(source);
    }
  });
};

defineExpose({
  map,
  addPointCloudLayer,
  addRouteLayer,
  addRobotMarker,
  clearLayers,
});
</script>

<style lang="scss" scoped>
.map-view {
  width: 100%;
  height: 100%;
  position: relative;

  .map-container {
    width: 100%;
    height: 100%;
  }
}
</style>

<style lang="scss">
.robot-marker {
  position: relative;
}
</style>
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
    default: () => [116.39708579534016, 39.909236612863054],
  },
  zoom: {
    type: Number,
    default: 20,
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
        osm: {
          type: "raster",
          tiles: ["https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"],
          tileSize: 256,
        },
      },
      layers: [
        {
          id: "osm-layer",
          type: "raster",
          source: "osm",
          minzoom: 0,
        },
      ],
    },
    center: props.center,
    zoom: props.zoom,
    maxZoom: 22,
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
  el.style.width = "40px";
  el.style.height = "40px";
  el.className = "robot-marker";
  el.innerHTML = `<img src="https://raw.githubusercontent.com/chenjacky131/dianyun-page/refs/heads/main/robot.png" alt="robot" style="width:100%;height:100%;" />`;
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

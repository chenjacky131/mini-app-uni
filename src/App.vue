<template>
  <div class="map-container">
    <MapView ref="mapViewRef" @map-ready="handleMapReady" />

    <FloorSelector
      :floors="floors"
      :currentFloor="currentFloorId"
      @floor-change="handleFloorChange"
      @start-robot-animation="startRobotAnimation"
    />
  </div>
</template>

<script setup>
import { ref, onUnmounted } from "vue";
import maplibregl from "maplibre-gl";
import MapView from "@/components/MapView/MapView.vue";
import FloorSelector from "@/components/FloorSelector/FloorSelector.vue";
import * as turf from "@turf/turf";
import { PointCloudLayer } from "@deck.gl/layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { LASWorkerLoader } from "@loaders.gl/las";
import { registerLoaders, load } from "@loaders.gl/core";
import { COORDINATE_SYSTEM } from "@deck.gl/core";
registerLoaders([LASWorkerLoader]);

const mapViewRef = ref(null);
const map = ref(null);
const currentFloorId = ref(1);
const routePoints = ref([]);
let animationId = null;
let currentMarker = null;
let overlay = null;

const floors = ref([
  {
    id: 1,
    name: "1层",
    lasUrl:
      "/static/data/segment_segment_1120-12025_11_20_15_58_052025_11_20_16_08_37.las",
  },
  { id: 2, name: "2层", lasUrl: "/static/data/data2.las" },
  { id: 3, name: "3层", lasUrl: "/static/data/data3.las" },
]);

const routeData = ref({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [116.39719410998993, 39.909067562209486],
          [116.39725579939676, 39.90905183561222],
          [116.39727867960329, 39.909075774400065],
          [116.39720543535714, 39.90909367765852],
        ],
      },
    },
  ],
});

const robotPosition = ref([116.39719410998993, 39.909067562209486]);
const robotHeading = ref(0);
let routeIndex = 0;

let isMoving = false;

const handleMapReady = (mapInstance) => {
  map.value = mapInstance;

  overlay = new MapboxOverlay({
    interleaved: true,
    layers: [],
  });
  map.value.addControl(overlay);
  setTimeout(() => {
    loadFloorData(currentFloorId.value);
  }, 500);
};

const handleFloorChange = (floorId) => {
  currentFloorId.value = floorId;
  loadFloorData(floorId);
};

const loadFloorData = (floorId) => {
  if (!mapViewRef.value || !mapViewRef.value.map) return;

  generateMockPointCloud(floorId);
};

const loadRouteData = () => {
  if (mapViewRef.value) {
    mapViewRef.value.addRouteLayer("robot-route", routeData.value);
  }
};
const handleRouteAnimationData = () => {
  routeData.value.features[0].geometry.coordinates.forEach((coord, index) => {
    const nextCoord =
      routeData.value.features[0].geometry.coordinates[index + 1];
    if (nextCoord) {
      const lineString = turf.lineString([coord, nextCoord]);
      let sliced = turf.lineChunk(lineString, 0.0001, {
        units: "kilometers",
      });
      if (sliced.features.length > 0) {
        sliced.features.map((item1, index1) => {
          item1.geometry.coordinates.map((d, dIndex) => {
            if (
              index1 !== 0 &&
              index1 !== sliced.features.length - 1 &&
              dIndex === 0
            )
              return;
            if (index !== 0 && dIndex === 0) return;
            routePoints.value.push(d);
          });
        });
      }
    }
  });
};
const loadRobotMarker = () => {
  if (mapViewRef.value) {
    mapViewRef.value.addRobotMarker(robotPosition.value, robotHeading.value);
  }
};

const startRobotAnimation = () => {
  const coordinates = routePoints.value;
  if (coordinates.length < 2) return;

  isMoving = true;
  routeIndex = 0;

  animateRobot(coordinates);
};

const animateRobot = (coordinates) => {
  if (!isMoving) return;

  const currentPoint = coordinates[routeIndex];
  if (!currentPoint) {
    isMoving = false;
    return;
  }
  robotPosition.value = currentPoint;
  routeIndex++;
  updateRobotMarker();

  animationId = requestAnimationFrame(() => animateRobot(coordinates));
};

const updateRobotMarker = () => {
  const el = document.getElementById("robot-marker");
  if (el && mapViewRef.value && mapViewRef.value.map) {
    el.style.transform = "rotate(" + robotHeading.value + "deg)";
    if (currentMarker) {
      currentMarker.remove();
    }
    currentMarker = new maplibregl.Marker({ element: el })
      .setLngLat(robotPosition.value)
      .addTo(mapViewRef.value.map);
  }
};

const generateMockPointCloud = (floorId) => {
  const lasUrl = floors.value.find((f) => f.id === floorId).lasUrl;
  const layers = [
    new PointCloudLayer({
      id: "las-layer",
      data: lasUrl,
      loader: LASWorkerLoader,
      // getPosition: (d) => {
      //   const pos = d.position || d;
      //   // 可以根据实际情况调整这个值，比如减去一个固定值或缩小比例
      //   return [pos[0], pos[1], pos[2] *2]; // 将 z 坐标缩小为原来的一半
      // },
      getNormal: [0, 1, 0],
      getColor: (d) => {
        return d.color;
      },
      opacity: 0.5, // 提高不透明度
      pointSize: 0.5, // 增大点大小
      pickable: true,
      coordinateOrigin: [116.39721610548906, 39.90908700915327],
      coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
      onDataLoad: (data) => {
        console.log("LAS data loaded:", data);
        loadRouteData();
        loadRobotMarker();
        handleRouteAnimationData();
      },
      onError: (error) => {
        console.error("Error loading LAS data:", error);
      },
    }),
  ];
  overlay.setProps({
    layers,
  });
};

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  isMoving = false;
  if (currentMarker) {
    currentMarker.remove();
  }
});
</script>

<style lang="scss">
.map-container {
  width: 100vw;
  height: 100vh;
  position: relative;
}
</style>

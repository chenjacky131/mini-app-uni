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
import { LASLoader, LASWorkerLoader } from "@loaders.gl/las";
import { registerLoaders, load } from "@loaders.gl/core";
import { COORDINATE_SYSTEM } from "@deck.gl/core";
registerLoaders([LASLoader, LASWorkerLoader]);

const mapViewRef = ref(null);
const map = ref(null);
const currentFloorId = ref(1);
const routePoints = ref([]);
let animationId = null;
let currentMarker = null;
let overlay = null;

const floors = ref([
  { id: 1, name: "1层", lasUrl: "/data/scene1_v12.las" },
  { id: 2, name: "2层", lasUrl: "/data/scene1_v12.las" },
  { id: 3, name: "3层", lasUrl: "/data/scene1_v12.las" },
]);

const routeData = ref({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [116.39702730118006, 39.90908730370461],
          [116.3972561003153, 39.909118856078464],
          [116.39718828271884, 39.90935895298634],
          [116.39697133375023, 39.90932813677841],
          [116.39702577049201, 39.909095649920886]
        ],
      },
    },
  ],
});

const robotPosition = ref([116.39702730118006, 39.90908730370461]);
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
  map.value.setPitch(32);
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

const generateMockPointCloud = async (floorId) => {
  if (typeof window === 'undefined') return;
  
  const lasUrl = floors.value.find((f) => f.id === floorId).lasUrl;
  console.log('Loading:', lasUrl);
  
  try {
    const lasData = await load(lasUrl, LASLoader, {
      worker: false,
    });
    console.log('LAS loaded:', lasData);
    
    const positionAttr = lasData.attributes.POSITION;
    const positionData = positionAttr.value;
    const count = positionData.length / 3;
    
    const colors = new Uint8Array(count * 3);
    for (let i = 0; i < count; i++) {
      const z = positionData[i * 3 + 2];
      const ratio = z / 5;
      colors[i * 3] = Math.floor(255 * ratio);
      colors[i * 3 + 1] = Math.floor(255 * (1 - ratio));
      colors[i * 3 + 2] = 100;
    }
    
    const data = {
      length: count,
      attributes: {
        POSITION: { value: positionData, size: 3 },
        COLOR_0: { value: colors, size: 3 },
      },
    };
    
const baseLng = 116.39717307630036;
    const baseLat = 39.90906812860439;
    
    const posArray = new Float64Array(count * 3);
    for (let i = 0; i < count; i++) {
      posArray[i * 3] = positionData[i * 3];
      posArray[i * 3 + 1] = positionData[i * 3 + 1];
      posArray[i * 3 + 2] = positionData[i * 3 + 2];
    }
    
    const layers = [
      new PointCloudLayer({
        id: "las-layer",
        data: lasData,
        getPosition: { type: 'accessor', size: 3 },
        getColor: { type: 'accessor', size: 3 },
        opacity: 1,
        pointSize: 3,
        pickable: true,
        coordinateOrigin: [baseLng, baseLat, 0],
        coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
      }),
    ];
    
    map.value.setCenter([baseLng, baseLat]);
    map.value.setZoom(19);
    overlay.setProps({
      layers,
    });
    
    loadRouteData();
    loadRobotMarker();
    handleRouteAnimationData();
    
  } catch (error) {
    console.error("Error loading LAS data:", error);
  }
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

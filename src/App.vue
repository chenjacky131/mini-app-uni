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
  {
    id: 1,
    name: "1层",
    lasUrl: "./data/segment_segment_1120-12025_11_20_15_58_052025_11_20_16_08_37.las",
  },
  { id: 2, name: "2层", lasUrl: "./data/segment_segment_1120-12025_11_20_15_58_052025_11_20_16_08_37.las" },
  { id: 3, name: "3层", lasUrl: "./data/segment_segment_1120-12025_11_20_15_58_052025_11_20_16_08_37.las" },
]);

const routeData = ref({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [116.39717307630036, 39.90906812860439],
          [116.39725011233872, 39.90904243142731],
          [116.39729098496844, 39.90908550382355],
          [116.39720209475303, 39.90910786034132],
          [116.39717568481046, 39.9090751984898]
        ],
      },
    },
  ],
});

const robotPosition = ref([116.39717307630036, 39.90906812860439]);
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
  map.value.setPitch(27);
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
  const lasUrl = floors.value.find((f) => f.id === floorId).lasUrl;
  
  try {
    // 先手动加载 LAS 数据，以便更好地控制加载过程
    const lasData = await load(lasUrl, LASLoader, {
      las: {
        skip: 1,
        normalize: true
      }
    });
    
    console.log("LAS data loaded manually:", lasData);
    
    const layers = [
      new PointCloudLayer({
        id: "las-layer",
        data: lasData,
        getColor: { type: 'array', value: 0, size: 4 },
        getNormal: [0, 0, 1],
        getPosition: { type: 'array', value: 0, size: 3 },
        opacity: 0.5,
        pointSize: 0.5,
        pickable: true,
        coordinateOrigin: [116.39721610548906, 39.90908700915327],
        coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
      }),
    ];
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

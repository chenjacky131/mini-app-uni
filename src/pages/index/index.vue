<template>
  <view class="map-container">
    <MapView ref="mapViewRef" @map-ready="handleMapReady" />
    
    <FloorSelector 
      :floors="floors"
      :currentFloor="currentFloorId"
      @floor-change="handleFloorChange"
    />
  </view>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import maplibregl from 'maplibre-gl'
import MapView from '@/components/MapView/MapView.vue'
import FloorSelector from '@/components/FloorSelector/FloorSelector.vue'

const mapViewRef = ref(null)
const map = ref(null)
const currentFloorId = ref(1)
let animationId = null
let currentMarker = null

const floors = ref([
  { id: 1, name: '1层', lasUrl: '/static/data/floor1.las' },
  { id: 2, name: '2层', lasUrl: '/static/data/floor2.las' },
  { id: 3, name: '3层', lasUrl: '/static/data/floor3.las' }
])

const routeData = ref({
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [116.39721610548906, 39.90908700915327],
        [116.39742800000187, 39.9090911240022],
        [116.39744409325618, 39.909224856448986],
        [116.39744945767364, 39.90931949771482],
        [116.3973207116411, 39.90933595705252],
        [116.39731802943231, 39.909453229716405],
      ]
    }
  }]
})

const robotPosition = ref([116.39721610548906, 39.90908700915327])
const robotHeading = ref(0)
let routeIndex = 0
let targetIndex = 1
let isMoving = false

const handleMapReady = (mapInstance) => {
  map.value = mapInstance
  
  setTimeout(() => {
    loadFloorData(currentFloorId.value)
    loadRouteData()
    loadRobotMarker()
    // startRobotAnimation()
  }, 500)
}

const handleFloorChange = (floorId) => {
  currentFloorId.value = floorId
  loadFloorData(floorId)
}

const loadFloorData = (floorId) => {
  if (!mapViewRef.value || !mapViewRef.value.map) return

  const points = generateMockPointCloud(floorId)
  
  const geojson = {
    type: 'FeatureCollection',
    features: points.map(p => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [p.position[0], p.position[1]]
      },
      properties: {
        color: p.color
      }
    }))
  }

  mapViewRef.value.addPointCloudLayer('floor-' + floorId, geojson, [255, 200, 100])
}

const loadRouteData = () => {
  if (mapViewRef.value) {
    mapViewRef.value.addRouteLayer('robot-route', routeData.value)
  }
}

const loadRobotMarker = () => {
  if (mapViewRef.value) {
    mapViewRef.value.addRobotMarker(robotPosition.value, robotHeading.value)
  }
}

const startRobotAnimation = () => {
  const coordinates = routeData.value.features[0].geometry.coordinates
  if (coordinates.length < 2) return

  isMoving = true
  routeIndex = 0
  targetIndex = 1
  animateRobot(coordinates)
}

const animateRobot = (coordinates) => {
  if (!isMoving) return

  const start = coordinates[routeIndex]
  const end = coordinates[targetIndex]
  
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  const distance = Math.sqrt(dx * dx + dy * dy)
  const speed = 0.00009

  if (distance < speed) {
    var x = end[0]
    var y = end[1]
    robotPosition.value = [x, y]
    routeIndex = targetIndex
    targetIndex++
    
    if (targetIndex >= coordinates.length) {
      routeIndex = 0
      targetIndex = 1
    }
  } else {
    const ratio = speed / distance
    robotPosition.value = [
      start[0] + dx * ratio,
      start[1] + dy * ratio
    ]
  }

  if (dx !== 0 || dy !== 0) {
    robotHeading.value = Math.atan2(dy, dx) * 180 / Math.PI
  }
  
  updateRobotMarker()

  animationId = requestAnimationFrame(() => animateRobot(coordinates))
}

const updateRobotMarker = () => {
  const el = document.getElementById('robot-marker')
  if (el && mapViewRef.value && mapViewRef.value.map) {
    el.style.transform = 'rotate(' + robotHeading.value + 'deg)'
    if (currentMarker) {
      currentMarker.remove()
    }
    currentMarker = new maplibregl.Marker({ element: el })
      .setLngLat(robotPosition.value)
      .addTo(mapViewRef.value.map)
  }
}

const generateMockPointCloud = (floorId) => {
  const points = []
  const baseLng = 116.397428
  const baseLat = 39.90923
  
  for (let i = 0; i < 500; i++) {
    points.push({
      position: [
        baseLng + (Math.random() - 0.5) * 0.0005,
        baseLat + (Math.random() - 0.5) * 0.0005,
        0
      ],
      color: [Math.random() * 255, Math.random() * 255, Math.random() * 255]
    })
  }
  
  return points
}

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  isMoving = false
  if (currentMarker) {
    currentMarker.remove()
  }
})
</script>

<style lang="scss">
.map-container {
  width: 100vw;
  height: 100vh;
  position: relative;
}
</style>
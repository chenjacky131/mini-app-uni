<template>
  <view class="deck-overlay-container">
    <canvas ref="canvasRef" class="deck-canvas"></canvas>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Deck } from '@deck.gl/core'
import { PointCloudLayer } from '@deck.gl/layers'
import { GeoJsonLayer } from '@deck.gl/layers'
import { IconLayer } from '@deck.gl/layers'
import type { Map } from 'maplibre-gl'

interface PointData {
  position: [number, number, number]
  color?: [number, number, number]
}

interface Props {
  map: Map | null
  pointCloudData?: PointData[]
  routeData?: any
  robotPosition?: [number, number]
  robotHeading?: number
}

const props = withDefaults(defineProps<Props>(), {
  map: null,
  pointCloudData: () => [],
  routeData: null,
  robotPosition: null,
  robotHeading: 0
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
const deck = ref<Deck | null>(null)
const isInitialized = ref(false)

onMounted(() => {
  if (props.map) {
    nextTick(() => {
      initDeck()
    })
  }
})

watch(() => props.map, (newMap) => {
  if (newMap && !isInitialized.value) {
    nextTick(() => {
      initDeck()
    })
  }
})

const initDeck = () => {
  const canvas = canvasRef.value
  if (!canvas) {
    console.error('Canvas not found')
    return
  }

  if (!props.map) {
    console.error('Map not ready')
    return
  }

  let mapCenter = { lng: 116.397428, lat: 39.90923 }
  let mapZoom = 18

  try {
    const center = props.map.getCenter()
    mapCenter = { lng: center.lng, lat: center.lat }
    mapZoom = props.map.getZoom()
  } catch (e) {
    console.warn('Map not fully loaded, using default center')
  }

  try {
    deck.value = new Deck({
      canvas: canvas,
      width: '100%',
      height: '100%',
      initialViewState: {
        longitude: mapCenter.lng,
        latitude: mapCenter.lat,
        zoom: mapZoom,
        pitch: 0,
        bearing: 0
      },
      layers: []
    })

    isInitialized.value = true
  updateLayers()
}

const updateLayers = () => {
  if (!deck.value || !isInitialized.value) return

  const layers = []

  if (props.pointCloudData && props.pointCloudData.length > 0) {
    layers.push(
      new PointCloudLayer({
        id: 'point-cloud',
        data: props.pointCloudData,
        getPosition: (d: PointData) => d.position,
        getColor: (d: PointData) => d.color || [255, 255, 255],
        pointSize: 2,
        pickable: true
      })
    )
  }

  if (props.routeData) {
    layers.push(
      new GeoJsonLayer({
        id: 'robot-route',
        data: props.routeData,
        getLineColor: [0, 255, 0, 200],
        getLineWidth: 3,
        lineWidthScale: 1,
        pickable: true
      })
    )
  }

  if (props.robotPosition) {
    const iconMapping = {
      marker: { x: 0, y: 0, width: 128, height: 128, mask: true }
    }

    layers.push(
      new IconLayer({
        id: 'robot-marker',
        data: [{
          position: props.robotPosition,
          angle: props.robotHeading
        }],
        iconMapping,
        getIcon: () => 'marker',
        getSize: 48,
        getColor: [255, 0, 0, 255],
        getAngle: (d: any) => d.angle,
        sizeScale: 1,
        pickable: true
      })
    )
  }

  deck.value.setProps({ layers })
}

watch(() => props.pointCloudData, updateLayers, { deep: true })
watch(() => props.routeData, updateLayers)
watch(() => props.robotPosition, updateLayers)
watch(() => props.robotHeading, updateLayers)

onUnmounted(() => {
  if (deck.value) {
    deck.value.finalize()
    deck.value = null
  }
})

defineExpose({
  deck
})
</script>

<style scoped>
.deck-overlay-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.deck-canvas {
  width: 100%;
  height: 100%;
}
</style>
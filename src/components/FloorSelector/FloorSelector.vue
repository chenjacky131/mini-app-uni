<template>
  <div class="floor-selector">
    <div 
      v-for="floor in floors" 
      :key="floor.id"
      :class="['floor-btn', { active: floor.id === currentFloor }]"
      @click="selectFloor(floor.id)"
    >
      {{ floor.name }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'FloorSelector',
  props: {
    floors: {
      type: Array,
      default: () => []
    },
    currentFloor: {
      type: Number,
      default: 1
    }
  },
  methods: {
    selectFloor(floorId) {
      this.$emit('floor-change', floorId)
    }
  }
}
</script>

<style lang="scss" scoped>
.floor-selector {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px 20px;
  border-radius: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;

  .floor-btn {
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    background: #f0f0f0;
    color: #333;
    cursor: pointer;
    transition: all 0.3s ease;

    &.active {
      background: #007aff;
      color: white;
    }
  }
}
</style>
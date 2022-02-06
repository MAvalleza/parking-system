<template lang="pug">
  v-container
    v-row(
      dense
      v-for="(slot, key) in parkingSlots"
      :key="key"
    )
      v-col
        h4 Slot {{ slot.slotNo }} - {{ slot.type | format-size }}
      v-col
        strong(:class="slot.occupiedBy ? 'error--text' : 'success--text'") {{ slot.occupiedBy ? 'OCCUPIED' : 'VACANT' }}
      v-col
        span(v-if="slot.occupiedBy") {{ slot.occupiedBy | format-vehicle }}
        i(v-else) No vehicle
      v-col(
        v-for="(distance, dKey) in slot.distances"
        :key="dKey"
      )
        span.primary--text {{ distance }}&nbsp;
        span from&nbsp;
        span.warning--text Entry {{ dKey + 1}}
</template>

<script>
const SLOT_SIZE_TEXT = {
  0: 'SP',
  1: 'MP',
  2: 'LP',
};

const VEHICLE_SIZE_TEXT = {
  0: 'SMALL',
  1: 'MEDIUM',
  2: 'LARGE',
};

export default {
  filters: {
    formatSize (type) {
      return SLOT_SIZE_TEXT[type];
    },
    formatVehicle (occupiedBy) {
      const matchedVehicle = this.vehicles.find(vehicle => vehicle.id === occupiedBy);
      if (matchedVehicle) return `${matchedVehicle.name} - ${VEHICLE_SIZE_TEXT[matchedVehicle.type]}`;
      return 'UNKNOWN VEHICLE';
    },
  },
  props: {
    parkingSlots: {
      type: Array,
      default: () => ([]),
    },
    vehicles: {
      type: Array,
      default: () => ([]),
    },
  },
};
</script>

<template lang="pug">
  v-container
    v-row(
      dense
      v-for="(slot, key) in parkingSlots"
      :key="key"
      style="font-size: 14px;"
    )
      v-col
        h4(:class="{'error--text': slot.occupiedBy}") Slot {{ slot.slotNo }} - {{ slot.type | format-size }}
      v-col
        span(v-if="slot.occupiedBy").error--text {{ formatVehicle(slot.occupiedBy) }}
        i(v-else) No vehicle
      v-col(
        v-for="(distance, dKey) in slot.distances"
        :key="dKey"
      )
        strong.primary--text {{ distance }}&nbsp;
        span &nbsp;-&nbsp;
        strong.warning--text Ent{{ dKey + 1}}
      v-col.text-center
        v-btn(small color="error" depressed :disabled="!slot.occupiedBy" @click="onUnpark(slot)") UNPARK
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
  methods: {
    formatVehicle (occupiedBy) {
      const matchedVehicle = this.vehicles.find(vehicle => vehicle.id === occupiedBy);
      if (matchedVehicle) return `${matchedVehicle.name} - ${VEHICLE_SIZE_TEXT[matchedVehicle.type]}`;
      return 'UNKNOWN VEHICLE';
    },
    onUnpark (slot) {
      this.$emit('unpark', slot);
    },
  },
};
</script>

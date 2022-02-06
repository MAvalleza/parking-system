<template lang="pug">
  div.d-flex
    v-select(
      :items="vehicles"
      item-value="id"
      outlined
      dense
      label="Select Vehicle to Park"
      :disabled="disabled"
      @change="onSelect($event)"
    )
      template(slot="selection" slot-scope="data")
        span {{ data.item.name }} - {{ data.item.type | format-size }}
      template(slot="item" slot-scope="data")
        span {{ data.item.name }} - {{ data.item.type | format-size }}
    h4.mx-5 or
    v-btn(
      color="secondary"
      depressed
      :disabled="disabled"
      to="/create-vehicle"
      @click="onCreate"
    ).text-none Add new vehicle
</template>

<script>

const SIZE_TEXT = {
  0: 'SMALL',
  1: 'MEDIUM',
  2: 'LARGE',
};

export default {
  filters: {
    formatSize (vehicleType) {
      return SIZE_TEXT[vehicleType];
    },
  },
  props: {
    vehicles: {
      type: Array,
      default: () => ([]),
    },
    disabled: Boolean,
  },
  methods: {
    onSelect (vehicle) {
      this.$emit('select', vehicle);
    },
    onCreate () {
      this.$emit('create');
    },
  },
};
</script>

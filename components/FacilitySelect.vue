<template lang="pug">
  div.d-flex
    v-select(
      :items="facilities"
      item-text="name"
      item-value="id"
      outlined
      dense
      label="Select Parking Facility"
      @change="onSelect($event)"
    )
    h4.mx-8 or
    v-btn(
      color="primary"
      depressed
      @click="onCreate"
    ).text-none Create new Parking Facility
</template>

<script>
export default {
  props: {
    facilities: {
      type: Array,
      default: () => ([]),
    },
  },
  methods: {
    onSelect (facility) {
      this.$emit('select', facility);
    },
    onCreate () {
      this.$emit('create');
    },
  },
};
</script>

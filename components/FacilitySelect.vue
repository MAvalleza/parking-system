<template lang="pug">
  div
    v-select(
      :items="facilities"
      item-text="name"
      item-value="id"
      outlined
      label="Select Parking Facility"
      @change="onSelect($event)"
    )
    v-btn(
      color="primary"
      depressed
      large
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

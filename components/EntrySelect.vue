<template lang="pug">
  div.d-flex
    v-select(
      v-model="selectedEntry"
      :items="entries"
      item-value="id"
      outlined
      dense
      label="Select Entry Point"
    ).mr-5
      template(slot="selection" slot-scope="data")
        span Entry {{ data.item.entryNo }}
      template(slot="item" slot-scope="data")
        span Entry {{ data.item.entryNo }}
    v-btn(
      color="success"
      depressed
      large
      :disabled="!selectedEntry"
      @click="onPark"
    ).text-none PARK
</template>

<script>
export default {
  props: {
    entries: {
      type: Array,
      default: () => ([]),
    },
  },
  data () {
    return {
      selectedEntry: null,
    };
  },
  methods: {
    onPark () {
      this.$emit('park', this.selectedEntry);
    },
  },
};
</script>

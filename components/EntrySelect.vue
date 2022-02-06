<template lang="pug">
  div
    v-select(
      v-model="selectedEntry"
      :items="entries"
      item-value="id"
      outlined
      dense
      label="Select Entry Point"
    )
      template(slot="selection" slot-scope="data")
        span Entry {{ data.item.entryNo }}
      template(slot="item" slot-scope="data")
        span Entry {{ data.item.entryNo }}
    div.d-flex
      //- Date Time
      date-time-picker(
        datetime
        outlined
        dense
        label="Parking Date and Time"
      )
      v-btn(
        color="success"
        depressed
        large
        :disabled="!selectedEntry"
        @click="onPark"
      ).text-none.ml-5 PARK
</template>

<script>
import DateTimePicker from './DateTimePicker';
export default {
  components: {
    DateTimePicker,
  },
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

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
      v-text-field(
        v-model="parkingStartTime"
        type="datetime-local"
        outlined
        dense
        label="Parking Date and Time"
      )
      v-btn(
        color="success"
        depressed
        large
        :disabled="!selectedEntry || !parkingStartTime"
        @click="onPark"
      ).text-none.ml-5 PARK
</template>

<script>
import { format, parseISO } from 'date-fns';
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
      parkingStartTime: null,
    };
  },
  methods: {
    onPark () {
      console.log('date time', this.parkingStartTime);
      console.log('formatted date time', format(parseISO(this.parkingStartTime), 'yyyy-mm-dd'));
      this.$emit('park', {
        entry: this.selectedEntry,
        startTime: this.parkingStartTime,
      });
    },
  },
};
</script>

<template lang="pug">
  div
    div.d-flex
      v-select(
        v-model="selectedEntry"
        :items="entries"
        item-value="entryNo"
        outlined
        dense
        label="Select Entry Point"
      )
        template(slot="selection" slot-scope="data")
          span Entry {{ data.item.entryNo }}
        template(slot="item" slot-scope="data")
          span Entry {{ data.item.entryNo }}
      h4.mx-5 or
      v-btn(
        color="warning"
        depressed
        @click="$emit('create:entry')"
      ).text-none Add new entry point
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
      console.log('formatted date time', format(parseISO(this.parkingStartTime), 'yyyy-MM-dd'));
      this.$emit('park', {
        entryNo: this.selectedEntry,
        startTime: this.parkingStartTime,
      });
    },
  },
};
</script>

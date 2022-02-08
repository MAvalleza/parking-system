<template lang="pug">
  v-dialog(v-model="dialog" width="600" persistent)
    v-card
      v-toolbar(flat color="primary")
        v-toolbar-title.white--text Create Entry {{ newEntryNo }}
      v-card-text.pa-4
        p Parking Slots: {{ slotsTotal }}
        v-text-field(
          label="Entry Slots Distances"
          v-model="distancesString"
          outlined
          dense
          hint="Separate inputs by comma"
        )
      v-divider
      v-card-actions
        v-spacer
        v-btn(
          color="error"
          outlined
          @click="cancel"
        ) Cancel
        v-btn(
          color="success"
          :disabled="!distancesString"
          @click="submit"
        ) Create Entry
    v-snackbar(
      v-model="snackVisible"
      :color="snackModel.color"
    ) {{ snackModel.message }}
</template>

<script>
import isNan from 'lodash/isNan';
export default {
  data () {
    return {
      dialog: false,
      resolve: null,
      reject: null,
      //
      distancesString: null,
      //
      slotsTotal: 0,
      newEntryNo: null,
      // snack
      snackVisible: false,
      snackModel: {
        color: null,
        message: null,
      },
    };
  },
  methods: {
    open ({ slotsTotal, newEntryNo }) {
      this.slotsTotal = slotsTotal;
      this.newEntryNo = newEntryNo;
      this.dialog = true;
      console.log('slots total', slotsTotal);
      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    },
    cancel () {
      this.resolve(false);
      this.dialog = false;
    },
    submit () {
      // Validate data
      const str = this.distancesString.replace(/\s+/g, '');
      const distancesArray = str.split(',');
      if (distancesArray.find(slot => isNan(slot) || parseInt(slot) < 1)) {
        this.snackModel = { color: 'warning', message: 'Distances input is invalid' };
        this.snackVisible = true;
        return;
      }

      if (distancesArray.length !== this.slotsTotal) {
        this.snackModel = { color: 'warning', message: 'Wrong number of inputs' };
        this.snackVisible = true;
        return;
      }

      const data = {
        distances: distancesArray.map(d => parseInt(d)),
        newEntryNo: this.newEntryNo,
      };
      this.resolve(data);
      this.dialog = false;
    },
  },
};
</script>

<template lang="pug">
  v-dialog(v-model="dialog" width="600" persistent)
    v-card
      v-toolbar(flat color="primary")
        v-toolbar-title.white--text Confirm Unparking
      v-card-text.pa-3
        h3 Parking Start
        p {{ startTime }}
        h3 Parking Slot Size
        p {{ slotSize }}
      v-divider
      v-card-actions
        v-spacer
        v-btn(color="error" outlined @click="cancel") Cancel
        v-btn(color="primary" outlined @click="confirm") Confirm
</template>

<script>
import { format, parseISO } from 'date-fns';
import { SIZE_TEXT } from '~/constants/slot-mappings';
export default {
  data () {
    return {
      dialog: false,
      resolve: null,
      reject: null,
      slotData: {},
      recordData: {},
      startTime: null,
      slotSize: null,
      //
      balance: 0,
      endTime: null,
    };
  },
  methods: {
    open ({
      slotData,
      recordData,
    }) {
      this.dialog = true;
      this.slotData = slotData;
      this.recordData = recordData;
      this.startTime = format(parseISO(recordData.startTime), 'MMM dd, yyyy, hh:mm aa');
      this.slotSize = SIZE_TEXT[slotData.type];
      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    },
    confirm () {
      const data = {
        balance: this.balance,
        endTime: this.endTime,
      };
      this.resolve(data);
      this.dialog = false;
    },
    cancel () {
      this.resolve(false);
      this.dialog = false;
    },
  },
};
</script>

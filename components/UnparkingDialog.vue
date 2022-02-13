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
        v-text-field(
          v-model="endTime"
          type="datetime-local"
          outlined
          dense
          label="Unparking Date and Time"
        )

        template(v-if="endTime")
          h2 TOTAL BALANCE:&nbsp;
            span.primary--text {{ balance.toLocaleString() }}
          h3 HOURS PARKED: {{ hoursParked }}
      v-divider
      v-card-actions
        v-spacer
        v-btn(color="error" outlined @click="cancel") Cancel
        v-btn(
          :disabled="!endTime"
          color="primary"
          @click="confirm"
        ) Confirm
</template>

<script>
import { format, parseISO } from 'date-fns';
import { SIZE_TEXT } from '~/constants/slot-mappings';
import { computeBalance } from '~/utils/parking';
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
      remainingHours: 0,
      hoursParked: 0,
      //
      endTime: null,
    };
  },
  watch: {
    endTime (val) {
      if (!val) {
        this.balance = 0;
        this.remainingHours = 0;
        return;
      }
      const { startTime, isContinuous, consumableHours } = this.recordData;
      const { balance, remainingHours, hoursParked } = computeBalance({
        startTime,
        endTime: val,
        slotType: this.slotData.type,
        isContinuous,
        consumableHours,
      });
      this.balance = balance;
      this.remainingHours = remainingHours;
      this.hoursParked = hoursParked;
    },
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
        remainingHours: this.remainingHours,
        endTime: this.endTime,
      };
      this.resolve(data);
      this.endTime = null;
      this.dialog = false;
    },
    cancel () {
      this.resolve(false);
      this.endTime = null;
      this.dialog = false;
    },
  },
};
</script>

<template lang="pug">
  v-container
    v-row
      v-col(cols="12" md="4" xl="3")
        h3 Create Parking Facility
        p Setup your parking slots and entry points
        v-text-field(
          label="Facility Name"
          v-model="facilityName"
          outlined
          dense
          hint="Press [ENTER]"
          :disabled="loading"
          @keyup.enter="showEntryInput = true"
        )
        v-text-field(
          v-if="showEntryInput"
          label="How many parking entries?"
          v-model="entriesTotal"
          outlined
          dense
          type="number"
          hint="At least 3"
          :disabled="loading"
          @keyup.enter="setupEntries"
        )
        v-text-field(
          v-if="showParkingSlotsInput"
          label="Input Parking Slots"
          v-model="parkingSlotsString"
          hint="0 - small, 1 - medium, 2 - large. Separate inputs by comma"
          outlined
          dense
          :disabled="loading"
          @keyup.enter="onParkingSlotsInput"
        )
        template(v-if="showDistanceInput")
          v-text-field(
            v-for="(entry, key) in entries"
            :key="key"
            v-model="entry.distancesString"
            outlined
            :label="`Entry ${entry.entryNo}- Slots Distances`"
            dense
            hint="Separate inputs by comma"
            :disabled="loading"
          )
        v-btn(
          v-if="showCreateButton"
          color="success"
          outlined
          :disabled="loading"
          :loading="loading"
          @click="validateInputs"
        ) Create Parking System
        br
        v-btn(
          color="error"
          to="/"
          outlined
          :disabled="loading"
        ).mt-5 Cancel
    v-snackbar(
      v-model="showSnack"
      :color="snackModel.color"
    ) {{ snackModel.message }}
</template>

<script>
import isNan from 'lodash/isNan';

const VALID_NUMBERS = [0, 1, 2];

export default {
  data () {
    return {
      loading: false,
      valid: false,
      showEntryInput: false,
      showParkingSlotsInput: false,
      showDistanceInput: false,
      showCreateButton: false,
      //
      facilityName: null,
      parkingSlotsString: null, // separated by comma
      parkingSlotsArray: [],
      parkingSlotsTotal: 0,
      entries: [],
      entriesTotal: 0,
      //
      facilityId: null,
      // snack
      showSnack: false,
      snackModel: {
        color: null,
        message: null,
      },
    };
  },
  methods: {
    setupEntries () {
      for (let i = 0; i < this.entriesTotal; i++) {
        const entryNo = i + 1;
        this.entries.push({
          entryNo,
          distancesString: null,
        });
      }
      this.showParkingSlotsInput = true;
    },
    onParkingSlotsInput () {
      const str = this.parkingSlotsString.replace(/\s+/g, '');
      this.parkingSlotsArray = str.split(',');
      console.log('parking slots', this.parkingSlotsArray);
      if (this.parkingSlotsArray.find(slot => isNan(parseInt(slot)) ||
        !VALID_NUMBERS.includes(parseInt(slot)))) {
        this.snackModel = { color: 'error', message: 'Parking slots input is invalid' };
        this.showSnack = true;
        return;
      }
      this.parkingSlotsTotal = this.parkingSlotsArray.length;
      this.showDistanceInput = true;
      this.showCreateButton = true;
    },
    validateInputs () {
      this.valid = true;
      console.log('entries', this.entries);
      this.entries.forEach((entry) => {
        const { distancesString } = entry;
        const str = distancesString.replace(/\s+/g, '');
        const distancesArray = str.split(',');
        if (distancesArray.find(slot => isNaN(slot) || parseInt(slot) < 1)) {
          this.snackModel = { color: 'error', message: 'Distances input is invalid' };
          this.showSnack = true;
          this.valid = false;
          return;
        }

        if (distancesArray.length !== this.parkingSlotsTotal) {
          this.snackModel = { color: 'error', message: 'Insufficient distance inputs' };
          this.showSnack = true;
          this.valid = false;
        }
      });

      if (!this.valid) return;
      this.createData();
    },
    async createData () {
      console.log('create');
      await Promise.all([
        this.createFacility(),
        this.createParkingEntries(),
      ]);
    },
    async createFacility () {
      try {
        this.loading = true;
        const facilityRef = await this.$fire.firestore.collection('parking-facilities').add({ name: this.facilityName });
        this.facilityId = facilityRef.doc().id;
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
    async createParkingEntries () {
      try {
        this.loading = true;
        const db = this.$fire.firestore;
        const batch = db.batch();
        this.entries.forEach((entry) => {
          const { entryNo } = entry;
          const entryRef = db.collection('parking-entries').doc();
          batch.set(entryRef, {
            entryNo,
            facility: db.doc(`parking-facilities/${this.facilityId}`),
          });
        });
        await batch.commit();
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

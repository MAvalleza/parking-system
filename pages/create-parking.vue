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
          @keyup.enter="onNameInput"
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
import { HOURLY_RATES } from '~/constants/slot-mappings';

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
  head () {
    return {
      title: 'Create Parking Facility',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Build a parking system',
        },
      ],
    };
  },
  methods: {
    onNameInput () {
      if (!this.facilityName) {
        this.snackModel = { color: 'warning', message: 'Provide a name' };
        this.showSnack = true;
        return;
      }
      this.showEntryInput = true;
    },
    setupEntries () {
      if (this.entriesTotal < 3) {
        this.snackModel = { color: 'warning', message: 'Entries must be at least 3' };
        this.showSnack = true;
        return;
      }
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
      if (!this.parkingSlotsString) {
        this.snackModel = { color: 'warning', message: 'Please provide an input' };
        this.showSnack = true;
        return;
      }
      const str = this.parkingSlotsString.replace(/\s+/g, '');
      this.parkingSlotsArray = str.split(',');
      console.log('parking slots', this.parkingSlotsArray);
      if (this.parkingSlotsArray.find(slot => isNan(parseInt(slot)) ||
        !VALID_NUMBERS.includes(parseInt(slot)))) {
        this.snackModel = { color: 'warning', message: 'Parking slots input is invalid' };
        this.showSnack = true;
        return;
      }
      this.parkingSlotsTotal = this.parkingSlotsArray.length;
      this.showDistanceInput = true;
      this.showCreateButton = true;
    },
    validateInputs () {
      this.valid = true;
      const entriesFormatted = this.entries.map((entry) => {
        const { distancesString, entryNo } = entry;
        if (!distancesString) {
          this.snackModel = { color: 'warning', message: 'Please provide an input' };
          this.showSnack = true;
          this.valid = false;
          return false;
        }
        const str = distancesString.replace(/\s+/g, '');
        const distancesArray = str.split(',');
        if (distancesArray.find(slot => isNan(slot) || parseInt(slot) < 1)) {
          this.snackModel = { color: 'warning', message: 'Distances input is invalid' };
          this.showSnack = true;
          this.valid = false;
          return false;
        }

        if (distancesArray.length !== this.parkingSlotsTotal) {
          this.snackModel = { color: 'warning', message: 'Wrong number of distance inputs' };
          this.showSnack = true;
          this.valid = false;
          return false;
        }
        return {
          entryNo,
          distancesArray,
        };
      });

      if (!this.valid) return;
      console.log('entriesFormatted', entriesFormatted);
      this.createData(entriesFormatted);
    },
    async createData (entries) {
      try {
        this.loading = true;
        await this.createFacility();
        await Promise.all([
          this.createParkingEntries(entries),
          this.createParkingSlots(entries),
        ]);
        // await this.createParkingDistances(entries);
        this.snackModel = { color: 'success', message: 'Parking system created successfully!' };
        this.showSnack = true;
        this.loading = false;
        this.$router.push('/');
      } catch (e) {
        console.error(e);
        this.snackModel = { color: 'error', message: e.message };
        this.showSnack = true;
      } finally {
        this.loading = false;
      }
    },
    async createFacility () {
      const facilityRef = await this.$fire.firestore.collection('parking-facilities').add({ name: this.facilityName });
      this.facilityId = facilityRef.id;
    },
    async createParkingEntries (entries) {
      const db = this.$fire.firestore;
      const batch = db.batch();
      entries.forEach((entry) => {
        const { entryNo } = entry;
        const entryRef = db.collection('parking-entries').doc();
        batch.set(entryRef, {
          entryNo,
          facility: this.facilityId,
        });
      });
      await batch.commit();
    },
    async createParkingSlots (entries) {
      const db = this.$fire.firestore;
      const batch = db.batch();
      this.parkingSlotsArray.forEach((slot, index) => {
        const slotInt = parseInt(slot);
        const distances = this.createParkingDistances(entries, index);
        const payload = {
          facility: this.facilityId,
          hourlyRate: HOURLY_RATES[slotInt],
          slotNo: index + 1,
          type: slotInt,
          occupiedBy: null,
          distances,
        };
        const slotRef = db.collection('parking-slots').doc();
        batch.set(slotRef, payload);
      });
      await batch.commit();
    },
    createParkingDistances (entries, index) {
      const distances = [];
      entries.forEach((entry) => {
        const distanceInt = parseInt(entry.distancesArray[index]);
        distances.push(distanceInt);
      });
      return distances;
    },
    // async createParkingDistances (entries) {
    //   const db = this.$fire.firestore;
    //   const batch = db.batch();
    //   entries.forEach((entry) => {
    //     const { entryNo } = entry;
    //     entry.distancesArray.forEach((distance, index) => {
    //       const distanceInt = parseInt(distance);
    //       const payload = {
    //         entryNo,
    //         distance: distanceInt,
    //         facility: this.facilityId,
    //         slotNo: index + 1,
    //       };
    //       const distanceRef = db.collection('parking-distances').doc();
    //       batch.set(distanceRef, payload);
    //     });
    //   });
    //   await batch.commit();
    // },
  },
};
</script>

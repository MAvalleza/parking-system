<template lang="pug">
  v-container
    h3 Parking System
    v-row.mt-10
      v-col(cols="12" md="7" xl="5")
        facility-select(
          :facilities="parkingFacilities"
          @select="onSelectFacility($event)"
          @create="setupCreateParking"
        )
    v-row.mt-5
      v-col(cols="12" md="7" xl="5")
        vehicle-select(
          :vehicles="vehicles"
          :disabled="!selectedFacilityId"
          @select="onSelectVehicle($event)"
        )
        entry-select(
          v-if="selectedVehicle"
          :entries="parkingEntries"
          @park="parkVehicle($event)"
          @create:entry="onCreateEntry"
        )
    v-divider
    v-row(
      v-if="showSystem"
      align="center"
    )
      v-col(cols="12")
        slots-list(
          :vehicles="vehicles"
          :parking-slots="parkingSlots"
          @unpark="unparkVehicle($event)"
        )
    unparking-dialog(ref="unparkingDialog")
    create-entry-dialog(ref="createEntryDialog")
    v-snackbar(
      v-model="snackVisible"
      :color="snackModel.color"
    ) {{ snackModel.message }}
    v-overlay(v-model="loading")
      v-progress-circular(indeterminate size="64")
</template>

<script>
import EntrySelect from '~/components/EntrySelect';
import FacilitySelect from '~/components/FacilitySelect';
import VehicleSelect from '~/components/VehicleSelect';
import SlotsList from '~/components/SlotsList';
import UnparkingDialog from '~/components/UnparkingDialog';
import CreateEntryDialog from '~/components/CreateEntryDialog';
import {
  getNearestAvailableSlot,
  createParkRecord,
  getParkRecord,
} from '~/utils/parking';
export default {
  components: {
    EntrySelect,
    FacilitySelect,
    VehicleSelect,
    SlotsList,
    UnparkingDialog,
    CreateEntryDialog,
  },
  async asyncData ({ $fire }) {
    const db = $fire.firestore;
    const facilitySnapshot = await db.collection('parking-facilities').get();
    const parkingFacilities = facilitySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    const vehicleSnapshot = await db.collection('vehicles').get();
    const vehicles = vehicleSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return { parkingFacilities, vehicles };
  },
  data () {
    return {
      loading: false,
      //
      showSystem: false,
      //
      selectedFacilityId: null,
      selectedVehicle: null,
      parkingEntries: [],
      parkingSlots: [],
      // snack
      snackVisible: false,
      snackModel: {
        color: null,
        message: null,
      },
    };
  },
  head () {
    return {
      title: 'Parking System',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Parking System made in Nuxt.js',
        },
      ],
    };
  },
  methods: {
    setupCreateParking () {
      this.$router.push({
        name: 'create-parking',
      });
    },
    onSelectFacility (facilityId) {
      console.log('selected facility', facilityId);
      this.selectedFacilityId = facilityId;
      this.loadData();
    },
    onSelectVehicle (vehicle) {
      console.log('selected vehicle', vehicle);
      this.selectedVehicle = vehicle;
    },
    async loadData () {
      try {
        this.loading = true;
        await Promise.all([
          this.loadParkingEntries(),
          this.loadParkingSlots(),
        ]);
        this.showSystem = true;
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
    async loadParkingEntries () {
      const db = this.$fire.firestore;
      const snapshot = await db.collection('parking-entries')
        .where('facility', '==', this.selectedFacilityId)
        .orderBy('entryNo')
        .get();
      this.parkingEntries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log('loaded entries', this.parkingEntries);
    },
    async loadParkingSlots () {
      const db = this.$fire.firestore;
      const snapshot = await db.collection('parking-slots')
        .where('facility', '==', this.selectedFacilityId)
        .orderBy('slotNo')
        .get();
      this.parkingSlots = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log('loaded slots', this.parkingSlots);
    },
    //
    async parkVehicle (parkData) {
      const { entryNo, startTime } = parkData;
      // Guard parked vehicle
      if (this.parkingSlots.find(slot => slot.occupiedBy === this.selectedVehicle.id)) {
        this.showSnack({ color: 'error', message: 'This vehicle is already parked.' });
        return;
      }
      const nearestSlot = getNearestAvailableSlot({
        entryNo,
        parkingSlots: this.parkingSlots,
        vehicleType: this.selectedVehicle.type,
      });
      console.log('nearest slot', nearestSlot);

      if (!nearestSlot) {
        this.showSnack({ color: 'error', message: 'No more available slots' });
        return;
      }
      try {
        this.loading = true;
        const db = this.$fire.firestore;
        // Create park record
        const newRecord = await createParkRecord(db, {
          vehicle: this.selectedVehicle.id,
          startTime,
          entryNo,
          slotNo: nearestSlot.slotNo,
          slotRef: nearestSlot.id,
          facility: this.selectedFacilityId,
        });

        // Update slots UI as occupied
        this.updateSlotsDisplay({
          slotRef: nearestSlot.id,
          vehicleId: this.selectedVehicle.id,
          recordRef: newRecord.id,
        });
        this.showSnack({
          color: 'success',
          message: 'Vehicle parked successfully!',
        });
      } catch (e) {
        console.error(e);
        this.showSnack({
          color: 'error',
          message: 'There was an error in parking the vehicle',
        });
      } finally {
        this.loading = false;
      }
    },
    async unparkVehicle (slot) {
      try {
        this.loading = true;
        const db = this.$fire.firestore;
        const existingRecord = await getParkRecord(db, slot.recordRef);
        console.log('existing Record', existingRecord);
        const result = await this.$refs.unparkingDialog.open({
          slotData: slot,
          recordData: existingRecord,
        });
        console.log('result', result);
        if (!result) return;

        // Update park record and parking slot
        await Promise.all([
          db.collection('parking-records').doc(existingRecord.id).update({
            remainingHours: result.remainingHours,
            endTime: result.endTime,
            balance: result.balance,
          }),
          db.collection('parking-slots').doc(slot.id).update({
            occupiedBy: null,
            recordRef: null,
          }),
        ]);
        // Update UI
        this.updateSlotsDisplay({
          slotRef: slot.id,
          vehicleId: null,
          recordRef: null,
        });
        this.showSnack({
          color: 'success',
          message: 'The vehicle has been unparked',
        });
      } catch (e) {
        console.error(e);
        this.showSnack({
          color: 'error',
          message: 'There was an error in unparking.',
        });
      } finally {
        this.loading = false;
      }
    },
    async onCreateEntry () {
      const result = await this.$refs.createEntryDialog.open({
        slotsTotal: this.parkingSlots.length,
        newEntryNo: this.parkingEntries.length + 1,
      });
      if (!result) return;
      console.log('result entry', result);
      try {
        this.loading = true;
        const { distances, newEntryNo } = result;
        const newDistances = [...this.parkingSlots].map((slot, index) => {
          const existingDistances = slot.distances;
          existingDistances.push(distances[index]);
          return existingDistances;
        });
        await this.createEntry(newEntryNo);
        await this.updateParkingDistances(newDistances);
        this.showSnack({
          color: 'success',
          message: 'New entry point created successfully!',
        });
      } catch (e) {
        console.error(e);
        this.showSnack({
          color: 'error',
          message: 'Failed to create a new entry point',
        });
      } finally {
        this.loading = false;
      }
    },
    async createEntry (newEntryNo) {
      const db = this.$fire.firestore;
      const payload = {
        entryNo: newEntryNo,
        facility: this.selectedFacilityId,
      };
      const newEntry = await db.collection('parking-entries').add(payload);
      // Update UI
      this.parkingEntries.push({ id: newEntry.id, ...payload });
    },
    async updateParkingDistances (newDistances) {
      const db = this.$fire.firestore;
      const batch = db.batch();
      this.parkingSlots.forEach((slot, index) => {
        const payload = {
          distances: newDistances[index],
        };
        const slotRef = db.collection('parking-slots').doc(slot.id);
        batch.update(slotRef, payload);
      });
      await batch.commit();
    },
    updateSlotsDisplay ({
      slotRef,
      vehicleId,
      recordRef,
    }) {
      this.parkingSlots = this.parkingSlots.map((slot) => {
        if (slot.id === slotRef) {
          slot.occupiedBy = vehicleId;
          slot.recordRef = recordRef;
        }
        return slot;
      });
    },
    //
    showSnack ({ color, message }) {
      this.snackModel = { color, message };
      this.snackVisible = true;
    },
  },
};
</script>

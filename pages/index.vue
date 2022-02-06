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
        )
    v-row(
      v-if="showSystem"
      align="center"
    )
      v-col(cols="12")
        h3 System here
        pre {{ parkingSlots }}
</template>

<script>
import EntrySelect from '~/components/EntrySelect';
import FacilitySelect from '~/components/FacilitySelect';
import VehicleSelect from '~/components/VehicleSelect';
export default {
  components: {
    EntrySelect,
    FacilitySelect,
    VehicleSelect,
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
      showSystem: false,
      //
      selectedFacilityId: null,
      selectedVehicle: null,
      parkingEntries: [],
      parkingSlots: [],
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
    onSelectVehicle (vehicleId) {
      console.log('selected vehicle', vehicleId);
      this.selectedVehicle = vehicleId;
    },
    async loadData () {
      try {
        await Promise.all([
          this.loadParkingEntries(),
          this.loadParkingSlots(),
        ]);
        this.showSystem = true;
      } catch (e) {
        console.error(e);
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
    parkVehicle () {
      //
    },
  },
};
</script>

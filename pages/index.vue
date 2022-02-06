<template lang="pug">
  v-container.fill-height
    v-row(align="center")
      v-col(cols="12" md="4" xl="3")
        facility-select(
          :facilities="parkingFacilities"
          @select="onSelectFacility($event)"
          @create="setupCreateParking"
        )
      v-col(cols="12" md="4" xl="3")
    v-row(
      v-if="showSystem"
      align="center"
    )
      v-col(cols="12")
        h3 System here
        pre {{ parkingSlots }}
</template>

<script>
import FacilitySelect from '~/components/FacilitySelect';
export default {
  components: {
    FacilitySelect,
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
  },
};
</script>

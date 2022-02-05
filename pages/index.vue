<template lang="pug">
  v-container.fill-height
    v-row(align="center")
      v-col(cols="12" md="4" xl="3")
        facility-select(
          :facilities="parkingFacilities"
          @create="setupCreateParking"
        )
</template>

<script>
import FacilitySelect from '~/components/FacilitySelect';
export default {
  components: {
    FacilitySelect,
  },
  async asyncData ({ $fire }) {
    const snapshot = await $fire.firestore.collection('parking-facilities').get();
    const parkingFacilities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return { parkingFacilities };
  },
  methods: {
    setupCreateParking () {
      this.$router.push({
        name: 'create-parking',
      });
    },
  },
};
</script>

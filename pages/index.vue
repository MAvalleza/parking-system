<template lang="pug">
  div
</template>

<script>

export default {
  asyncData ({ $fire }) {
    const snapshot = await $fire.firestore.collection('parking-facilities').get();
    const parkingFacilities = snapshot.docs.map(doc => doc.data());
    return parkingFacilities;
  }
};
</script>
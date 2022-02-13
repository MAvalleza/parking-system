<template lang="pug">
  v-container
    v-row
      v-col(cols="12" md="4" xl="3")
        h3 Create a Vehicle
        p Setup a new vehicle
        v-text-field(
          label="Vehicle Name"
          v-model="vehicleName"
          outlined
          dense
          :disabled="loading"
        )
        v-select(
          label="Vehicle Size"
          v-model="vehicleType"
          :items="vehicleTypes"
          item-text="text"
          item-value="value"
          dense
          outlined
          :disabled="loading"
        )
        v-btn(
          color="success"
          outlined
          :disabled="loading || !vehicleName || !vehicleType"
          :loading="loading"
          @click="createVehicle"
        ) Create Vehicle
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
export default {
  data () {
    this.vehicleTypes = [
      { text: 'SMALL', value: 0 },
      { text: 'MEDIUM', value: 1 },
      { text: 'LARGE', value: 2 },
    ];
    return {
      loading: false,
      //
      vehicleName: null,
      vehicleType: null,
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
      title: 'Create Vehicle',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Add a vehicle to the list',
        },
      ],
    };
  },
  methods: {
    async createVehicle () {
      try {
        this.loading = true;
        const db = this.$fire.firestore;
        const payload = {
          name: this.vehicleName,
          type: this.vehicleType,
        };
        await db.collection('vehicles').add(payload);
        this.snackModel = { color: 'success', message: 'Vehicle created succesfully!' };
        this.showSnack = true;
        this.$router.push('/');
      } catch (e) {
        console.error(e);
        this.snackModel = { color: 'error', message: 'Failed to create vehicle' };
        this.showSnack = true;
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

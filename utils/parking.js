import isEmpty from 'lodash/isEmpty';

export const getNearestAvailableSlot = ({
  entryNo,
  parkingSlots,
  vehicleType,
}) => {
  // Allowed slots are those where vehicle type is less than or equal to the size of the slot and are not occupied
  // We retrieve the distance pertaining to the entry point
  // Finally, we sort everything according to the distance and get the first element
  const filteredSlots = parkingSlots.filter(slot => !slot.occupiedBy && vehicleType <= slot.type)
    .map(slot => ({
      id: slot.id,
      slotNo: slot.slotNo,
      distance: slot.distances[entryNo - 1],
    }))
    .sort((a, b) => a.distance - b.distance);
  return filteredSlots[0];
};

export const createParkRecord = async (db, {
  vehicle,
  startTime,
  entryNo,
  slotNo,
  slotRef,
  facility,
}) => {
  // TODO: Check if continuous
  // - If there is a record of the vehicle from one hour ago
  const continuousRecord = {};

  // - TODO: Compute consumable hours
  const record = {
    balance: 0,
    consumableHours: 0, // dependent on computed
    isContinuous: !isEmpty(continuousRecord),
    startTime,
    endTime: null,
    entryNo,
    slotNo,
    slotRef,
    facility,
    vehicle,
  };
  console.log('record', record);

  const newRecord = await db.collection('parking-records').add(record); // Add to records collection
  // Update slot as occupied
  await db.collection('parking-slots').doc(slotRef).update({
    occupiedBy: vehicle,
    recordRef: newRecord.id,
  });
  return newRecord;
};

export const getParkRecord = async (db, recordId) => {
  const snapshot = await db.collection('parking-records').doc(recordId).get();
  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

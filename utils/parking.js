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
      slotNo: slot.slotNo,
      distance: slot.distances[entryNo - 1],
    }))
    .sort((a, b) => a.distance - b.distance);
  return filteredSlots[0];
};

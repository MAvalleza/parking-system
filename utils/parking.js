import isEmpty from 'lodash/isEmpty';
import { differenceInHours, parseISO } from 'date-fns';
import { HOURLY_RATES } from '~/constants/slot-mappings';

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

export const computeBalance = ({
  startTime,
  endTime,
  slotType,
  isContinuous,
  consumableHours,
}) => {
  // TODO: Confirm regarding overtime 24 hour chunk
  // Compute time difference
  const hoursParked = differenceInHours(parseISO(endTime), parseISO(startTime), { roundingMethod: 'ceil' });
  console.log('hours', hoursParked);

  // get hourly overtime rate
  const OVERTIME_PER_HOUR = HOURLY_RATES[slotType];

  let balance = 0;
  let chargeableHours = 0; // hours to be charged for excess
  if (isContinuous) {
    chargeableHours = hoursParked - consumableHours;
  } else {
    // FRESH CHARGE
    balance += 40;
    chargeableHours = hoursParked - 3; // Since we already charged 40 for flat rate, we deduct 3 hours from the chargeable hours
  }
  // No more hours to charge
  if (!chargeableHours) return { balance, remainingHours: 0, hoursParked };

  // Negative chargeableHours mean that the vehicle did not consume fully what it has paid for
  if (chargeableHours < 0) return { balance, remainingHours: Math.abs(chargeableHours), hoursParked };

  if (chargeableHours >= 24) {
    // Split hours that are chargeable by 24-hour chunks
    const nonChunkedHours = chargeableHours % 24;
    const chunkedHours = (chargeableHours - nonChunkedHours) / 24;

    balance += (nonChunkedHours * OVERTIME_PER_HOUR) + (chunkedHours * 5000);
    return {
      balance,
      remainingHours: 0,
      hoursParked,
    };
  }

  // Charge remaining hours with overtime rate
  balance += (chargeableHours * OVERTIME_PER_HOUR);
  return {
    balance,
    remainingHours: 0,
    hoursParked,
  };
};

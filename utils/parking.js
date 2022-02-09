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
  const record = {
    balance: 0,
    consumableHours: 0,
    remainingHours: 0,
    isContinuous: false,
    startTime,
    endTime: null,
    entryNo,
    slotNo,
    slotRef,
    facility,
    vehicle,
  };

  // Check if continuous by checking previous records
  const previousRecordsSnapshot = await db.collection('parking-records')
    .where('facility', '==', facility)
    .where('vehicle', '==', vehicle)
    .where('endTime', '!=', null)
    .orderBy('endTime', 'desc')
    .limit(1)
    .get();

  const previousRecords = previousRecordsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
  const recentRecord = previousRecords[0];

  console.log('recentRecord', recentRecord);
  if (!isEmpty(recentRecord)) {
    const parkingSessionDifference = differenceInHours(parseISO(startTime), parseISO(recentRecord.endTime), { roundingMethod: 'ceil' });
    record.isContinuous = parkingSessionDifference <= 1;
    record.consumableHours = record.isContinuous ? Math.ceil(recentRecord.remainingHours - parkingSessionDifference) : 0;
  }

  console.log('record payload', record);

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
  // Compute time difference
  const hoursParked = differenceInHours(parseISO(endTime), parseISO(startTime), { roundingMethod: 'ceil' });
  console.log('hours', hoursParked);

  const BASE_RATE = 40; // flat rate
  const DAY_EXCESS_CHARGE = 5000; // 24 hrs or more
  // get hourly overtime rate
  const OVERTIME_PER_HOUR = HOURLY_RATES[slotType];

  let balance = 0;

  // If reached 24-hour mark, apply excess charging for 24-hrs
  if (hoursParked >= 24) {
    // Split hours that are chargeable by 24-hour chunks
    const nonChunkedHours = hoursParked % 24;
    const chunkedHours = (hoursParked - nonChunkedHours) / 24;

    balance += (nonChunkedHours * OVERTIME_PER_HOUR) + (chunkedHours * DAY_EXCESS_CHARGE);
    return {
      balance,
      remainingHours: 0,
      hoursParked,
    };
  }

  let chargeableHours = 0; // hours subject to charges
  if (isContinuous) {
    chargeableHours = hoursParked - consumableHours;
  } else {
    chargeableHours = hoursParked - 3;
    balance += BASE_RATE;
  }
  // No more hours to charge
  if (!chargeableHours) return { balance, remainingHours: 0, hoursParked };

  // Negative chargeableHours mean that the vehicle did not consume fully what it has paid for
  if (chargeableHours < 0) return { balance, remainingHours: Math.abs(chargeableHours), hoursParked };

  // Charge remaining hours with overtime rate
  balance += (chargeableHours * OVERTIME_PER_HOUR);
  return {
    balance,
    remainingHours: 0,
    hoursParked,
  };
};

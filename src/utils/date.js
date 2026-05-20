export const normalizeToUTCMidnight = (date) => {
  if (!date) return null;
  date = new Date(date);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.setUTCHours(0, 0, 0, 0));
};

export const isDateRangeOutside = (childStart, childEnd, parentStart, parentEnd) => {
  const start = normalizeToUTCMidnight(childStart);
  const end = normalizeToUTCMidnight(childEnd);
  const boundaryStart = normalizeToUTCMidnight(parentStart);
  const boundaryEnd = normalizeToUTCMidnight(parentEnd);

  if (!boundaryStart && !boundaryEnd) return false;
  if (start && boundaryStart && start < boundaryStart) return true;
  if (end && boundaryEnd && end > boundaryEnd) return true;
  return false;
};

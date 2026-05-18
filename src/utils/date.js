export const normalizeToUTCMidnight = (date) => {
  date = new Date(date);
  return new Date(date.setUTCHours(0, 0, 0, 0));
};

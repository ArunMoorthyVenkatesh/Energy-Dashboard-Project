export function getCurrentTimestamp() {
  const tzOffset = localStorage.getItem('selectedTimeZone');

  let date = new Date();

  if (tzOffset) {
    const offsetMinutes = parseTimezoneOffset(tzOffset);
    const localOffset = date.getTimezoneOffset();
    date = new Date(date.getTime() + (localOffset + offsetMinutes) * 60 * 1000);
  }

  return formatDateTime(date);
}

function parseTimezoneOffset(offset) {

  const match = offset.match(/([+-])(\d{2}):(\d{2})/);
  if (!match) return 0;

  const sign = match[1] === '-' ? -1 : 1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);
  return sign * (hours * 60 + minutes);
}

function formatDateTime(date) {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  const d = days[date.getDay()];
  const DD = String(date.getDate()).padStart(2, '0');
  const MMM = months[date.getMonth()];
  const YYYY = date.getFullYear();

  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');

  return `${d} ${DD} ${MMM} ${YYYY} | ${HH}:${mm}:${ss}`;
}

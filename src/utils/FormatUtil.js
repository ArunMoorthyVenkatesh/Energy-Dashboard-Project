export function formatDate(date) {
  return date
    .toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(',', '');
}

export function formatWithCommas(num) {
  if (num == null) return '';
  if (typeof num === 'string') return num;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function toCapitalLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatFixed2(value) {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : '-';
}
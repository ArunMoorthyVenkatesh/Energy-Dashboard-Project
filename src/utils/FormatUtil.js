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

/**
 * Auto-scale power units (kW -> W, MW, GW)
 * @param {number} kw - Power in kilowatts
 * @returns {{ value: string, unit: string }}
 */
export function autoScalePower(kw) {
  if (kw == null || !Number.isFinite(kw)) return { value: '-', unit: '' };

  const absKw = Math.abs(kw);

  if (absKw >= 1000000) {
    // GW (Gigawatts)
    return { value: (kw / 1000000).toFixed(2), unit: 'GW' };
  } else if (absKw >= 1000) {
    // MW (Megawatts)
    return { value: (kw / 1000).toFixed(2), unit: 'MW' };
  } else if (absKw >= 1) {
    // kW (Kilowatts)
    return { value: kw.toFixed(2), unit: 'kW' };
  } else {
    // W (Watts)
    return { value: (kw * 1000).toFixed(2), unit: 'W' };
  }
}

/**
 * Auto-scale energy units (kWh -> Wh, MWh, GWh)
 * @param {number} kwh - Energy in kilowatt-hours
 * @returns {{ value: string, unit: string }}
 */
export function autoScaleEnergy(kwh) {
  if (kwh == null || !Number.isFinite(kwh)) return { value: '-', unit: '' };

  const absKwh = Math.abs(kwh);

  if (absKwh >= 1000000) {
    // GWh (Gigawatt-hours)
    return { value: (kwh / 1000000).toFixed(2), unit: 'GWh' };
  } else if (absKwh >= 1000) {
    // MWh (Megawatt-hours)
    return { value: (kwh / 1000).toFixed(2), unit: 'MWh' };
  } else if (absKwh >= 1) {
    // kWh (Kilowatt-hours)
    return { value: kwh.toFixed(2), unit: 'kWh' };
  } else {
    // Wh (Watt-hours)
    return { value: (kwh * 1000).toFixed(2), unit: 'Wh' };
  }
}
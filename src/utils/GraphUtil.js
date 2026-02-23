export function niceScale(min, max, maxTicks = 5) {
  const range = niceNum(max - min, false);
  const tickSpacing = niceNum(range / (maxTicks - 1), true);

  const niceMinimum = Math.floor(min / tickSpacing) * tickSpacing;
  const niceMaximum = Math.ceil(max / tickSpacing) * tickSpacing;

  const ticks = [];
  for (let v = niceMinimum; v <= niceMaximum + 0.000001; v += tickSpacing) {
    ticks.push(Number(v.toFixed(10)));
  }

  return { niceMinimum, niceMaximum, tickSpacing, ticks };
}

function niceNum(range, round) {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);

  let niceFraction;
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }

  return niceFraction * Math.pow(10, exponent);
}

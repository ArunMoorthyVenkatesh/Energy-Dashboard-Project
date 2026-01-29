export function buildOpenWeatherIconUrl(iconCode, size = '2x') {
  if (!iconCode) return null;
  const suffix = size === '2x' ? '@2x' : '';
  return `https://openweathermap.org/img/wn/${iconCode}${suffix}.png`;
}

export function roundTemp(value) {
  return Number.isFinite(value) ? Math.round(value) : null;
}

export function normalizeOneCallWeather(data) {
  const main = data?.current?.weather?.[0]?.main || null;

  return {
    main, // <-- ADD
    current: Math.round(data?.current?.temp),
    min: Math.round(data?.daily?.[0]?.temp?.min),
    max: Math.round(data?.daily?.[0]?.temp?.max),
  };
}
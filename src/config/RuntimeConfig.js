let cachedConfig = null;

const CONFIG_PATH =
  window.location.pathname.startsWith('/v2')
    ? '/v2/runtime-config.json'
    : '/runtime-config.json';

export const loadRuntimeConfig = async () => {
  if (cachedConfig) return cachedConfig;

  const res = await fetch(CONFIG_PATH, { cache: 'no-cache' });
  if (!res.ok) throw new Error('Cannot load runtime-config.json');

  cachedConfig = await res.json();
  return cachedConfig;
};

import axios from 'axios';

// ✅ FIX: Use REACT_APP_ prefix for Create React App
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1/iot";
const API_KEY = process.env.REACT_APP_API_KEY || "dev-ws-key";

let TOKEN = '';
let configLoaded = false;

const loadRuntimeConfig = async () => {
  if (configLoaded) return;

  try {
    const res = await fetch('/v2/runtime-config.json', {
      cache: 'no-cache',
    });

    if (!res.ok) {
      console.warn('Runtime config not found, using environment variables');
      configLoaded = true;
      return;
    }

    const config = await res.json();
    TOKEN = config.TOKEN;
    configLoaded = true;
  } catch (error) {
    console.warn('Failed to load runtime config:', error);
    configLoaded = true;
  }
};

const API = () => {
  const instance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'X-api-key': API_KEY,
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });

  // --- retries ---
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;

      if (!config || config.__retryCount >= 2) {
        return Promise.reject(error);
      }

      config.__retryCount = (config.__retryCount || 0) + 1;

      // retry only for network / 5xx
      if (!error.response || error.response.status >= 500) {
        return instance(config);
      }

      return Promise.reject(error);
    }
  );

  instance.interceptors.request.use(
    async (config) => {
      if (!configLoaded) {
        await loadRuntimeConfig();
      }

      if (TOKEN) {
        config.headers.Authorization = `Bearer ${TOKEN}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  return instance;
};

export default API();
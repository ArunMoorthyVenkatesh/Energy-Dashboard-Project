import axios from 'axios';

const baseURL = process.env.REACT_APP_OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/3.0';
const apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY || '37fda0833aab7db6bedac01d28284c59';

export const WeatherAPI = {
  getOneCall({ lat, lon, units = 'metric' }) {
    if (!apiKey) {
      throw new Error('Missing REACT_APP_OPENWEATHER_API_KEY');
    }

    return axios.get(`${baseURL}/onecall`, {
      params: {
        lat,
        lon,
        exclude: 'minutely,hourly,alerts',
        units,
        appid: apiKey,
      },
    });
  },
};

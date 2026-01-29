import clear from '../assets/weather/clear.svg';
import clouds from '../assets/weather/clouds.svg';
import rain from '../assets/weather/rain.svg';
import snow from '../assets/weather/snow.svg';
import thunder from '../assets/weather/thunder.svg';
import mist from '../assets/weather/mist.svg';
import unknown from '../assets/weather/unknown.svg';

export function getWeatherIcon(main) {
  if (!main) return unknown;

  switch (main.toLowerCase()) {
    case 'clear':
      return clear;
    case 'clouds':
      return clouds;
    case 'rain':
    case 'drizzle':
      return rain;
    case 'snow':
      return snow;
    case 'thunderstorm':
      return thunder;
    case 'mist':
    case 'fog':
    case 'haze':
      return mist;
    default:
      return unknown;
  }
}

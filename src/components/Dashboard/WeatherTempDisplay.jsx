import styles from './weatherTempDisplay.module.css';
import { getWeatherIcon } from '../../utils/WeatherIconMap';

export default function WeatherTempDisplay({ main, current, min, max }) {
  const icon = getWeatherIcon(main);
   return (
    <div className={styles.weatherBox}>
      <img className={styles.weatherIcon} src={icon} alt={main || 'weather'} />

      <div className={styles.weatherTemp}>
        <span className={styles.currentTemp}>
          {current ?? '--'}˚
        </span>
        <span className={styles.minMaxTemp}>
          {(min ?? '--')}˚ / {(max ?? '--')}˚
        </span>
      </div>
    </div>
  );
}

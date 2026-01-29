import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/iot-dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={styles.container}>
      <img
        src={`${process.env.PUBLIC_URL}/semply-logo.jpg`}
        alt="Semply Logo"
        className={styles.logo}
      />
    </div>
  );
}

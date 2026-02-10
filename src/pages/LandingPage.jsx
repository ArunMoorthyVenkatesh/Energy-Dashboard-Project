import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    // Navigate after 5 seconds
    const timer = setTimeout(() => {
      navigate('/iot-dashboard');
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [navigate]);

  return (
    <div className={styles.container}>
      {/* Animated background */}
      <div className={styles.background}>
        <div className={`${styles.blob} ${styles.blob1}`}></div>
        <div className={`${styles.blob} ${styles.blob2}`}></div>
        <div className={`${styles.blob} ${styles.blob3}`}></div>
        <div className={`${styles.blob} ${styles.blob4}`}></div>
      </div>

      {/* Main content */}
      <div className={styles.content}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <img
            src={`${process.env.PUBLIC_URL}/semply-logo-2.png`}
            alt="SEMPLY"
            className={styles.logo}
            onError={(e) => {
              console.error('Logo failed to load from:', e.target.src);
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Welcome Text */}
        <div className={styles.welcomeSection}>
          <h1 className={styles.title}>Welcome to SEMPLY</h1>
          <p className={styles.subtitle}>Energy Management & IoT Dashboard</p>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressSection}>
          <div className={styles.progressBarContainer}>
            <div
              className={styles.progressBar}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className={styles.progressText}>Loading your dashboard...</p>
        </div>

        {/* Dots animation */}
        <div className={styles.dotsContainer}>
          <div className={`${styles.dot} ${styles.dot1}`}></div>
          <div className={`${styles.dot} ${styles.dot2}`}></div>
          <div className={`${styles.dot} ${styles.dot3}`}></div>
        </div>
      </div>
    </div>
  );
}
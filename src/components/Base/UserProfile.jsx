import styles from './userprofile.module.css';
import { useEffect } from 'react';

export default function UserProfile({ picture, name }) {
  return (
    <div className={styles.container}>
      <div className={styles.profilePic}>
        <span>M</span>
      </div>
      <div className={styles.profileName}>
        <span>My Name</span>
      </div>
    </div>
  );
}

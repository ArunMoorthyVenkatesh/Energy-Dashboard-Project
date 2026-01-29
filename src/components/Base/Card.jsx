import styles from './card.module.css';

export default function Card({ children, className, style }) {
  return (
    <div className={`${styles.container} ${className}`} style={style}>
      {children}
    </div>
  );
}

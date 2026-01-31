import styles from './Step.module.css';

export default function Step({ number, text, active }) {
  return (
    <div 
      className={styles.step}
      style={{
        opacity: active ? 1 : 0.3,
        transform: active ? 'translateX(0)' : 'translateX(-10px)',
      }}
    >
      <span 
        className={styles.stepNumber}
        style={{
          background: active ? 'linear-gradient(135deg, #22d3ee, #a78bfa)' : '#27272a',
        }}
      >
        {number}
      </span>
      <span className={styles.stepText}>{text}</span>
      {active && <span className={styles.stepCheck}>✓</span>}
    </div>
  );
}

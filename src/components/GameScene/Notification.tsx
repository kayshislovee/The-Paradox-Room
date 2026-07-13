import styles from './Notification.module.css';

interface Props {
  text: string;
  type: 'info' | 'success' | 'error';
}

export function Notification({ text, type }: Props) {
  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      {text}
    </div>
  );
}

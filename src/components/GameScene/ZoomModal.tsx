import { useGameStore } from '../../store/gameStore';
import styles from './ZoomModal.module.css';

interface Props { image: string; label: string; }

export function ZoomModal({ image, label }: Props) {
  const closeZoom = useGameStore((s) => s.closeZoom);

  return (
    <div className={styles.overlay} onClick={closeZoom}>
      <div className={styles.box} onClick={(e) => e.stopPropagation()}>
        <p className={styles.label}>{label}</p>
        <img src={image} alt={label} className={styles.img} />
        <button className={styles.close} onClick={closeZoom}>✕ Tutup</button>
      </div>
    </div>
  );
}

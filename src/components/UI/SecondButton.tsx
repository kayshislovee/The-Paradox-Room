import React, { useState } from 'react';
import './SecondButton.css';

interface EscapeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Menentukan apakah tombol dalam keadaan terkunci (khas escape room) */
  isLocked?: boolean;
  /** Teks atau konten di dalam tombol */
  children: React.ReactNode;
}

export const EscapeButton: React.FC<EscapeButtonProps> = ({ 
  isLocked = false, 
  children, 
  onClick, 
  ...props 
}) => {
  const [interacted, setInteracted] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setInteracted(true);
    // Hapus efek interaksi setelah animasi selesai (opsional)
    setTimeout(() => setInteracted(false), 300);
    
    if (onClick) onClick(e);
  };

  return (
    <button 
      className={`escape-btn ${isLocked ? 'locked' : 'unlocked'} ${interacted ? 'clicked' : ''}`}
      onClick={handleClick}
      disabled={isLocked || props.disabled}
      {...props}
    >
      {/* Ikon Gembok Minimalis (Hanya muncul jika isLocked true) */}
      {isLocked && (
        <svg 
          className="lock-icon" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      )}
      
      <span className="btn-text">{children}</span>
    </button>
  );
};
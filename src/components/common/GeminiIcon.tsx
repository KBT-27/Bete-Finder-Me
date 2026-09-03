import React from 'react';

interface GeminiIconProps {
  size?: number;
  className?: string;
  gradientId?: string;
}

export const GeminiIcon: React.FC<GeminiIconProps> = ({ 
  size = 20, 
  className = '',
  gradientId = 'gemini-star-grad'
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4E82EE" />
          <stop offset="50%" stopColor="#9B72CF" />
          <stop offset="100%" stopColor="#D96570" />
        </linearGradient>
      </defs>
      {/* Official Google Gemini 4-pointed sparkle icon */}
      <path 
        d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4772 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.52285 12 2Z" 
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
};

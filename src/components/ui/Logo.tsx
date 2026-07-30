import React from 'react';

export function Logo({ className, textClassName }: { className?: string, textClassName?: string }) {
  return (
    <svg 
      viewBox="0 0 200 240" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Arch */}
      <path d="M 20,100 A 80,80 0 0,1 180,100" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      
      {/* Three People */}
      {/* Center person */}
      <circle cx="100" cy="110" r="14" fill="currentColor" />
      <path d="M 82,150 Q 100,115 118,150 L 100,195 Z" fill="currentColor" />
      <path d="M 75,115 Q 100,105 125,115" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none" />
      
      {/* Left person */}
      <circle cx="65" cy="125" r="12" fill="currentColor" />
      <path d="M 45,150 Q 65,120 82,150 L 68,185 Z" fill="currentColor" />
      <path d="M 40,135 Q 65,115 78,140" stroke="currentColor" strokeWidth="7" strokeLinecap="round" fill="none" />

      {/* Right person */}
      <circle cx="135" cy="125" r="12" fill="currentColor" />
      <path d="M 118,150 Q 135,120 155,150 L 132,185 Z" fill="currentColor" />
      <path d="M 122,140 Q 135,115 160,135" stroke="currentColor" strokeWidth="7" strokeLinecap="round" fill="none" />

      {/* Gear */}
      <circle cx="100" cy="65" r="24" stroke="currentColor" strokeWidth="5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <line 
          key={i}
          x1="100" y1="36" x2="100" y2="28" 
          stroke="currentColor" strokeWidth="8" strokeLinecap="round"
          transform={`rotate(${angle} 100 65)`}
        />
      ))}
      
      {/* Bulb inside gear */}
      <path d="M 90,72 Q 100,45 110,72 L 105,85 L 95,85 Z" fill="currentColor" />

      {/* Text */}
      <text x="100" y="215" fontFamily="sans-serif" fontSize="36" fontWeight="900" fill="currentColor" textAnchor="middle" className={textClassName}>UNITY</text>
      <text x="100" y="235" fontFamily="sans-serif" fontSize="14" fontWeight="600" fill="currentColor" textAnchor="middle" letterSpacing="1" className={textClassName}>ENTERPRISES</text>
    </svg>
  );
}
